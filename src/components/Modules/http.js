import axios from "axios";


export const http= (isToken = null)=>{
   axios.defaults.baseURL=import.meta.env.VITE_ENDPOINT;
  if (isToken){
    axios.defaults.headers.common["Authorization"]=`Bearer ${isToken}`;
  }
  return axios;
};


export const fetcher=async (api,)=>{
  try{
    const httpReq=http();
    const {data}=await httpReq.get(api);
    return data;

  }catch(err){
    return null;
  }

}

export const trimData = (obj) => {
  for (let key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].trim();
    }
  }
  return obj;
};