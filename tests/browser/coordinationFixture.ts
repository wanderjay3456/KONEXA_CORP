// Local UI fixture only; database transitions are verified in rollback SQL.
import {company,student,projectId} from './ids';
export const relationId='30000000-0000-4000-8000-000000000001', contractId='40000000-0000-4000-8000-000000000001';
export const coordinationSnapshot:any={introductions:[{id:relationId,companyId:company,talentId:student,projectId,status:'active',contactStatus:'locked'}],
  contracts:[{id:contractId,relationshipId:relationId,companyId:company,talentId:student,title:'Research project agreement',status:'active'}],
  consents:[],signatures:[],milestones:[],payments:[],contactUnlocks:[],hiringOffers:[],disputes:[],riskEvents:[],reviews:[],workPassport:[]};
