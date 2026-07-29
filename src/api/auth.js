import httpReq from "./httpReq";

export const getSession = async()=>{
    const {data}= await httpReq.get("/api/auth/session",{withCredentials:true,});
    return data;
}
