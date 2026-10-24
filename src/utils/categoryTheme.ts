import { EntityCategory } from '../engine/types';

export interface CategoryBadgeInfo {
  tag: string;
  label: string;
  group: 'CREDENTIALS' | 'NETWORK' | 'IDENTITY' | 'CUSTOM';
  pillClass: string;
}

export const CATEGORY_STYLES: Record<EntityCategory, CategoryBadgeInfo> = {
  db_uri: {
    tag: 'DB',
    label: 'Database URI',
    group: 'CREDENTIALS',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  ipv4: {
    tag: 'IP',
    label: 'IPv4 Address',
    group: 'NETWORK',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  secret: {
    tag: 'KEY',
    label: 'API Key / Secret',
    group: 'CREDENTIALS',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  email: {
    tag: 'EMAIL',
    label: 'Email Address',
    group: 'IDENTITY',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  url: {
    tag: 'HOST',
    label: 'Internal Host',
    group: 'NETWORK',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  phone: {
    tag: 'PHONE',
    label: 'Phone Number',
    group: 'IDENTITY',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  person: {
    tag: 'PERSON',
    label: 'Person Name',
    group: 'IDENTITY',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  project: {
    tag: 'PROJECT',
    label: 'Project Codename',
    group: 'CUSTOM',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  company: {
    tag: 'COMPANY',
    label: 'Company Name',
    group: 'IDENTITY',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
  custom: {
    tag: 'CUSTOM',
    label: 'Custom Mask',
    group: 'CUSTOM',
    pillClass: 'alias-pill bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
  },
};
