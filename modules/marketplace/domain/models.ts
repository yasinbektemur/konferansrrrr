export type InstitutionStatus = 'pending' | 'verified' | 'rejected';
export type ListingStatus = 'draft' | 'review' | 'published' | 'rejected' | 'archived';
export type SubmissionStatus = 'submitted' | 'reviewing' | 'accepted' | 'rejected' | 'withdrawn';
export type Actor = { id:string; name:string; email:string; role:string; status:string };
export type Institution = {
  id:string; name:string; countryCode:string; websiteUrl:string; description:string;
  status:InstitutionStatus; version:number; creationHash:string; listingCount:number;
};
export type ListingInput = {
  id:string; institutionId:string; version:number; title:string; summary:string; description:string;
  type:string; attendanceMode:string; officialUrl:string; deadline:string; applyMode:'platform'|'external';
};
export type Listing = ListingInput & {deletedAt?:string|null;status:ListingStatus; institutionName:string; creationHash:string; applicantCount:number};
export type Submission = {
  id:string; opportunityId:string; applicantId:string; applicantName:string; applicantEmail:string;
  message:string; status:SubmissionStatus; decisionNote:string; version:number; createdAt:string;
  title:string; institutionName:string;
};
export type SubmissionFilter={applicantId?:string;opportunityId?:string;search?:string;status?:string};
export type SubmissionPage={items:Submission[];total:number;page:number;pages:number};
export const listingLabels:Record<ListingStatus,string> = {draft:'Taslak',review:'İncelemede',published:'Yayında',rejected:'Düzeltme istendi',archived:'Kapalı'};
export const submissionLabels:Record<SubmissionStatus,string> = {submitted:'Gönderildi',reviewing:'Değerlendiriliyor',accepted:'Kabul edildi',rejected:'Olumsuz sonuçlandı',withdrawn:'Geri çekildi'};
export const institutionLabels:Record<InstitutionStatus,string> = {pending:'Doğrulama bekliyor',verified:'Kurum onaylı',rejected:'Onaylanmadı'};
