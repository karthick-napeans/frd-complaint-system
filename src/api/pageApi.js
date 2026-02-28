import { getRequest } from "./apiService";
import { postRequest } from "./apiService";
import { getRequestWithBody } from "./apiService";

//getRequest 
export const healthCheck = () => {
    return getRequest("/health/check");
};

export const getAllUsers = () => {
    return getRequest("/users/GetAll");
}

export const getCustomerComplaints = () => {
    return getRequest("/complaints/list");
}

export const getMstCustomers = () => {
    return getRequest("/masters/customers");
}

export const getMstParts = () => {
    return getRequest("/masters/parts");
}

export const getMstModels = () => {
    return getRequest("/masters/models");
}

export const getMstRepairCause = () => {
    return getRequest("/masters/repair-cause-codes");
}

export const getMstColumns = () => {
    return getRequest(`/field-report/master-columns`);
};

export const getUploadHistory = () => {
    return getRequest("/warranty-claims/upload/history");
}

export const getDreList = () => {
    return getRequest("/dre/list");
}

export const getComplaintsList = () => {
    return getRequest("/complaints/list");
}

export const getCustomerColumnMapping = (customerId) => {
    return getRequest(`/customer-excel-mappings/${customerId}`);
};

export const getAttachmentChecklist = () => {
    return getRequest(`/complaints/attachments/checklist`)
}

export const getAllImprovementList = () => {
    return getRequest(`/improvements/get`)
}


//postRequest
export const loginApi = (payload) => {
    return postRequest("/auth/login", payload);
};

export const createUser = (payload) => {
    return postRequest("/users/create", payload);
}

export const updateUser = (payload) => {
    return postRequest(`/users/update`, payload);
}

export const deleteUser = (id) => {
    return postRequest(`/users/active`, { UserId: id });
}

export const saveDreDraft = (payload) => {
    return postRequest("/dre/save", payload);
};

export const saveDreWithFiles = (formData) => {
    return postRequest("/dre/save", formData);
};

export const submitCustomerComplaint = (formData) => {
    console.log("Submitting complaint with FormData:", formData);
    return postRequest("/complaints/save", formData);
};

export const submitColumnMapping = (payload) => {
    return postRequest("/customer-excel-mappings/save", payload);
};

export const uploadWarrantyClaims = (formData) => {
    return postRequest("/warranty-claims/upload", formData);
}

export const getWrantyReport = (payload) => {
    console.log("Generating warranty report with payload:", payload);
    return postRequest(
        "/warranty-claims/analysis/report_new",
        payload
    );
};

export const saveImprovementBaseline = (payload) => {
    return postRequest("/improvements/create", payload);
}

export const deleteImprovementBaseline = (payload) => {
    return postRequest("/improvements/delete", payload);
}

export const getDashboardData = (payload) => {
    return postRequest("/dashboard/data", payload);
}


