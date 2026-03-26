export type TNavItem = {
    name: string,
    id: string,
    component: any
    route?: string ,
}


export type TNavbarInfo = {
    name: string,
    items: TNavItem[],
    downloadInfo?: string, 
}