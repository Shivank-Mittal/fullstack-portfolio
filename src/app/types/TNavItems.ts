export type TNavItem = {
    name: string,
    id: string,
    route?: string 
}


export type TNavbarInfo = {
    name: string,
    items: TNavItem[],
    downloadInfo?: string  
}