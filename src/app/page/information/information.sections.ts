import { TUserNavInfo, TUserNavSection } from '../../types/TUserNavItems';
import { faBars, faGripVertical, faCalendar, faHourglassHalf, faGear, faListCheck } from '@fortawesome/free-solid-svg-icons';

export const DOCUMENT_SECTIONS: TUserNavSection = {
    name: 'Documents',
    id: 'documents',
    enabled: true,
    items: [
      { name: 'Resumes', id: 'resume', enabled: true, router: '/resume', icon: faBars },
      { name: 'Cover letters', id: 'cover-letter', enabled: false, router: '/cover-letter', icon: faGripVertical },
    ],
  }


export const SCHEDULE_SECTIONS: TUserNavSection = {
    name: 'Schedule',
    id: 'schedule',
    enabled: true,
    items: [
      { name: 'Calendar', id: 'calendar', enabled: true, router: '/calendar', icon: faCalendar },
      { name: 'Availability', id: 'availability', enabled: false, router: '/availability', icon: faHourglassHalf },
    ],
  }

export const ACTIVITY_SECTIONS: TUserNavSection = {
    name: 'Activity',
    id: 'activity',
    enabled: true,
    items: [
      { name: 'Settings', id: 'settings', enabled: false, router: '/settings', icon: faGear },
    ],
  } 

export const JOB_SECTIONS: TUserNavSection = {
    name: 'Jobs',
    id: 'jobs',
    enabled: true,
    items: [
      { name: 'Applications', id: 'applications', enabled: true, router: '/application', icon: faListCheck },
    ],
  } 


