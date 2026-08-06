import { User } from '../user/user.model.js';
import { verifyApiKey } from '../ai/ai.service.js';
import { encrypt, decrypt, maskKey } from '../../utils/crypto.util.js';
import { config } from '../../config/env.config.js';
import { badRequest, tooManyRequests, internalServer } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

const KEY_FIELDS = '+aiSettings.gemini +aiSettings.groq';

// Placeholder values ship in .env.example — a key equal to (or still shaped like) the
// placeholder means that provider was never actually configured on this server.
const isSystemKeyUsable = (key) => Boolean(key) && !key.startsWith('your_');

// Order the free tier tries system-level keys in when the user has no personal key.
const SYSTEM_PROVIDER_ORDER = [
  { provider: 'gemini', getKey: () => config.ai.geminiApiKey },
  { provider: 'groq', getKey: () => config.ai.groqApiKey },
];

const resolveSystemContext = () => {
  for (const { provider, getKey } of SYSTEM_PROVIDER_ORDER) {
    const apiKey = getKey();
    if (isSystemKeyUsable(apiKey)) {
      return { provider, apiKey };
    }
  }
  return null;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const buildAiSettingsView = (user) => {
  const geminiKey = user.aiSettings?.gemini ? decrypt(user.aiSettings.gemini) : null;
  const groqKey = user.aiSettings?.groq ? decrypt(user.aiSettings.groq) : null;
  const hasPersonalKey = Boolean(geminiKey || groqKey);

  const usedToday = user.dailyUsage?.date === todayKey() ? user.dailyUsage.count : 0;

  return {
    preferredProvider: user.aiSettings?.preferredProvider || 'gemini',
    providers: {
      gemini: { connected: Boolean(geminiKey), maskedKey: maskKey(geminiKey) },
      groq: { connected: Boolean(groqKey), maskedKey: maskKey(groqKey) },
    },
    freeUsage: {
      unlimited: hasPersonalKey,
      used: usedToday,
      limit: config.freeDailyLimit,
      remaining: hasPersonalKey ? null : Math.max(0, config.freeDailyLimit - usedToday),
    },
  };
};

export const getAiSettings = async (userId) => {
  const user = await User.findById(userId).select(KEY_FIELDS);
  return buildAiSettingsView(user);
};

export const saveApiKey = async (userId, { provider, apiKey }) => {
  const isValid = await verifyApiKey(provider, apiKey);
  if (!isValid) {
    throw badRequest(MESSAGES.SETTINGS.INVALID_API_KEY(provider), null, ERROR_CODES.SETTINGS_INVALID_API_KEY);
  }

  const encrypted = encrypt(apiKey);
  await User.findByIdAndUpdate(userId, {
    $set: {
      [`aiSettings.${provider}`]: encrypted,
      'aiSettings.preferredProvider': provider,
    },
  });

  return getAiSettings(userId);
};

export const removeApiKey = async (userId, provider) => {
  const user = await User.findById(userId).select(KEY_FIELDS);
  const update = { $unset: { [`aiSettings.${provider}`]: '' } };

  if (user.aiSettings?.preferredProvider === provider) {
    const fallbackProvider = provider === 'gemini' ? 'groq' : 'gemini';
    update.$set = { 'aiSettings.preferredProvider': fallbackProvider };
  }

  await User.findByIdAndUpdate(userId, update);
  return getAiSettings(userId);
};

export const setPreferredProvider = async (userId, provider) => {
  const user = await User.findById(userId).select(KEY_FIELDS);
  const hasKey = provider === 'gemini' ? Boolean(user.aiSettings?.gemini) : Boolean(user.aiSettings?.groq);

  if (!hasKey) {
    throw badRequest(MESSAGES.SETTINGS.PROVIDER_NOT_CONNECTED(provider), null, ERROR_CODES.SETTINGS_PROVIDER_NOT_CONNECTED);
  }

  await User.findByIdAndUpdate(userId, { $set: { 'aiSettings.preferredProvider': provider } });
  return getAiSettings(userId);
};

/**
 * Resolves which AI provider + API key a recipe request should use.
 * BYOK (user has their own key for their preferred provider) is unlimited.
 * Otherwise falls back to whichever system key is actually configured — Gemini
 * first, then Groq — and enforces the free daily quota.
 */
export const resolveAiContext = async (userId) => {
  const user = await User.findById(userId).select(KEY_FIELDS);
  const provider = user.aiSettings?.preferredProvider || 'gemini';
  const encryptedKey = user.aiSettings?.[provider];
  const personalKey = encryptedKey ? decrypt(encryptedKey) : null;

  if (personalKey) {
    return { provider, apiKey: personalKey, userId, usingPersonalKey: true };
  }

  await enforceFreeQuota(user);

  const systemContext = resolveSystemContext();
  if (!systemContext) {
    throw internalServer(
      'No AI provider is configured on this server yet. Add your own API key in Settings, or ask the admin to configure one.',
      ERROR_CODES.RECIPE_AI_FAILED,
    );
  }

  return { ...systemContext, userId, usingPersonalKey: false };
};

const enforceFreeQuota = async (user) => {
  const today = todayKey();
  if (user.dailyUsage?.date !== today) {
    user.dailyUsage = { count: 0, date: today };
  }

  if (user.dailyUsage.count >= config.freeDailyLimit) {
    throw tooManyRequests(MESSAGES.RECIPE.FREE_LIMIT_REACHED(config.freeDailyLimit), ERROR_CODES.RECIPE_FREE_LIMIT_REACHED);
  }

  user.dailyUsage.count += 1;
  await user.save();
};
