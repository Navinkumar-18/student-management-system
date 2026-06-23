import React from 'react';

const ICON_MAP = {
  dashboard: 'dashboard',
  calendar_today: 'calendar_today',
  calendar_month: 'calendar_month',
  assignment: 'assignment',
  grade: 'grade',
  payments: 'payments',
  event_busy: 'event_busy',
  assessment: 'assessment',
  person: 'person',
  settings: 'settings',
  logout: 'logout',
  search: 'search',
  notifications: 'notifications',
  arrow_upward: 'arrow_upward',
  arrow_downward: 'arrow_downward',
  trending_up: 'trending_up',
  trending_down: 'trending_down',
  priority_high: 'priority_high',
  more_vert: 'more_vert',
  add: 'add',
  edit: 'edit',
  delete: 'delete',
  download: 'download',
  upload: 'upload',
  filter_list: 'filter_list',
  close: 'close',
  check_circle: 'check_circle',
  cancel: 'cancel',
  schedule: 'schedule',
  school: 'school',
  groups: 'groups',
  account_balance_wallet: 'account_balance_wallet',
  edit_document: 'edit_document',
  visibility: 'visibility',
  mail: 'mail',
  phone: 'phone',
  chevron_right: 'chevron_right',
  chevron_left: 'chevron_left',
  expand_more: 'expand_more',
  menu: 'menu',
  menu_open: 'menu_open',
};

export default function Icon({ name, size = 24, className = '' }) {
  return (
    <span
      className={`material-icons-outlined ${className}`}
      style={{ fontSize: size }}
    >
      {ICON_MAP[name] || name}
    </span>
  );
}
