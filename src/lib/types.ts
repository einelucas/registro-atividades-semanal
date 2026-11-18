export type Role = 'MANAGER' | 'COLLABORATOR';
export type ActivityStatus = 'DONE' | 'IN_PROGRESS';
export type Person = { id:string; name:string; role:Role };
export type Option = { id:string; name:string };
export type Activity = { id:string; personId:string; person:string; unitId:string; unit:string; categoryId:string; category:string; description:string; status:ActivityStatus; date:string; createdAt:string };
export type Bootstrap = { people:Person[]; units:Option[]; categories:Option[]; activities:Activity[]; demo:boolean; currentUserId:string };
