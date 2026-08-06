import { User } from './user.model.js';

const buildPreferencesView = (user) => ({
  onboardingCompleted: user.preferences?.onboardingCompleted || false,
  dietaryPreference: user.preferences?.dietaryPreference || null,
  favoriteCuisines: user.preferences?.favoriteCuisines || [],
  favoriteDishes: user.preferences?.favoriteDishes || [],
  preferredLanguage: user.preferences?.preferredLanguage || 'en',
});

export const getPreferences = async (userId) => {
  const user = await User.findById(userId);
  return buildPreferencesView(user);
};

export const savePreferences = async (userId, { dietaryPreference, favoriteCuisines, favoriteDishes, preferredLanguage }) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'preferences.onboardingCompleted': true,
        'preferences.dietaryPreference': dietaryPreference,
        'preferences.favoriteCuisines': favoriteCuisines,
        'preferences.favoriteDishes': favoriteDishes || [],
        'preferences.preferredLanguage': preferredLanguage,
      },
    },
    { new: true },
  );
  return buildPreferencesView(user);
};
