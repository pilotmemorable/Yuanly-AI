import { Language } from '../i18n/translations';

interface ExperienceLike {
  title?: string | null;
  titleCn?: string | null;
  titleTr?: string | null;
  description?: string | null;
  descriptionCn?: string | null;
  descriptionTr?: string | null;
  tags?: string[] | null;
}

export function getLocalizedExperienceTitle(experience: ExperienceLike, language: Language) {
  if (language === 'CN') {
    return experience.titleCn || experience.title || experience.titleTr || '';
  }

  if (language === 'TR') {
    return experience.titleTr || experience.title || experience.titleCn || '';
  }

  return experience.title || experience.titleCn || experience.titleTr || '';
}

export function getLocalizedExperienceDescription(experience: ExperienceLike, language: Language) {
  if (language === 'CN') {
    return experience.descriptionCn || experience.description || experience.descriptionTr || '';
  }

  if (language === 'TR') {
    return experience.descriptionTr || experience.description || experience.descriptionCn || '';
  }

  return experience.description || experience.descriptionCn || experience.descriptionTr || '';
}

export function hasCategoryTag(experience: ExperienceLike, category: string) {
  if (!category) {
    return true;
  }

  return (experience.tags || []).includes(category);
}
