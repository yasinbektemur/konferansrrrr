import type { Actor, Institution, InstitutionStatus, Listing, ListingInput, ListingStatus, Submission, SubmissionStatus, SubmissionFilter, SubmissionPage } from '../domain/models';

export interface RecruitmentRepository {
  transaction<T>(work:()=>T):T;
  actor(id:string):Actor|null;
  membership(userId:string,institutionId:string):string|null;
  institution(id:string):Institution|null;
  institutions(options:{userId?:string;publicOnly?:boolean;search?:string;page?:number}):{items:Institution[];total:number;page:number;pages:number};
  createInstitution(actorId:string,input:Omit<Institution,'status'|'version'|'listingCount'>):void;
  setInstitutionStatus(id:string,status:InstitutionStatus,version:number):void;
  updateInstitution(id:string,input:Pick<Institution,'name'|'countryCode'|'websiteUrl'|'description'>,status:InstitutionStatus,version:number):void;
  submission(id:string):Submission|null;
  submissionFor(applicantId:string,opportunityId:string):Submission|null;
  submissions(options:{applicantId?:string;opportunityId?:string;search?:string;status?:string}):Submission[];
  submissionPage(options:SubmissionFilter,page:number):SubmissionPage;
  insertSubmission(id:string,actor:Actor,opportunityId:string,message:string):void;
  setSubmissionStatus(id:string,status:SubmissionStatus,note:string,version:number):void;
  renewConsent(id:string,actor:Actor):void;
  audit(actorId:string,action:string,entityType:string,id:string,metadata?:Record<string,unknown>):void;
  notify(userId:string,opportunityId:string,key:string,title:string,body:string):void;
}

// The catalog owns opportunities. Publication is accessed through this explicit port.
export interface InstitutionalCatalog {
  get(id:string):Listing|null;
  list(options:{institutionId?:string;publicOnly?:boolean;reviewOnly?:boolean;trash?:boolean}):Listing[];
  save(input:ListingInput,institution:Institution,actorId:string,creationHash:string):void;
  transition(id:string,status:ListingStatus,version:number):void;
}
