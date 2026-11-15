import { emptyGeoState, type GeoState } from './geo';
let connection:Promise<IDBDatabase>|undefined;
function database(){
  if(!connection)connection=new Promise<IDBDatabase>((resolve,reject)=>{
    const request=indexedDB.open('jeeb-ten-geography',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('game');
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();connection=undefined;};resolve(request.result);};
    request.onerror=()=>{connection=undefined;reject(Error('تعذر فتح سجل الأسئلة. اسمح بالتخزين على هذا الجهاز.'));};
    request.onblocked=()=>{connection=undefined;reject(Error('أغلق النسخ الأخرى من اللعبة ثم جرّب ثانية.'));};
  });return connection;
}
export async function updateGeoState<T>(change:(state:GeoState)=>T):Promise<{state:GeoState;result:T}>{
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('game','readwrite'),store=tx.objectStore('game'),request=store.get('state');let state:GeoState,result:T,error:unknown;
    request.onsuccess=()=>{try{state=request.result||emptyGeoState();result=change(state);store.put(state,'state');}catch(e){error=e;tx.abort();}};
    tx.oncomplete=()=>resolve({state:structuredClone(state),result});
    tx.onabort=tx.onerror=()=>reject(error||Error('تعذر حفظ الجولة. ما انتقلنا إلى السؤال التالي.'));
  });
}
export const readGeoState=async()=> (await updateGeoState(()=>undefined)).state;
