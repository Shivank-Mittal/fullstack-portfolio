import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type TUserNavItem = {
    name: string,
    id: string,
    enabled: boolean,
    router: string,
    icon?: IconDefinition,
}

export type TUserNavSection = {
    name: string,
    id: string,
    items: TUserNavItem[],
    enabled?: boolean,
}


export type TUserNavInfo = TUserNavSection[];