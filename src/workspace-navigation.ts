// Keep each tab's workspace separate, including accounts that share this device.
export const workspacePageKey = (user: {id:string;org_id:string}) =>
  `solair-page:${user.id}:${user.org_id}`;

export function permittedPage(page: string | null, role: string): string {
  const shared = ['Overview','Live Fleet Map','Vehicle details','Energy','Security','SOS & Assistance','Settings','Messages','History & Reports','Help and support','Report a problem','Terms of Service','Privacy Policy'];
  shared.push('Notifications',...settingsPages);
  const fleet = ['Vehicles'];
  const administration = ['People & assignments','Organizations','Activity log'];
  const allowed = [...shared, ...(role !== 'driver' ? fleet : []),
    ...(['admin','engineer'].includes(role) ? ['Devices','CPE Lab'] : []),
    ...(role === 'admin' ? administration : [])];
  return page && allowed.includes(page) ? page : 'Overview';
}

export const settingsPages:string[]=['Settings','Account profile','My registration and assignments','Contact & SMS preferences','Notification preferences','Appearance','Account setup'];
export function settingsDestination(page:string,target?:string){
 if(page!=='Settings'||!target)return {page,target};
 const destinations:Record<string,string>={'profile-settings':'Account profile','registration-details':'My registration and assignments','alert-contact':'Contact & SMS preferences','verify-mobile':'Contact & SMS preferences','email-verification':'Contact & SMS preferences','account-setup':'Account setup'};
 return {page:destinations[target]||page,target};
}
