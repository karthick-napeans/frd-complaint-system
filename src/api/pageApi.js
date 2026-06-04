import { getRequest } from "./apiService";
import { postRequest } from "./apiService";
import { getRequestWithBody } from "./apiService";
import { deleteRequest } from "./apiService";

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

export const getMstDefects = () => {
    return getRequest("/masters/defect");
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

export const getComplaintsList = (payload) => {
    return getRequest("/complaints/list", payload);
}

export const getCustomerColumnMapping = (customerId) => {
    return getRequest(`/customer-excel-mappings/${customerId}`);
};

export const downloadZip = async (complaintID) => {
    const blob = await getRequest(
        `complaints/download-all-attachment/${complaintID}`,
        {},
        {
            responseType: "blob",
        }
    );
    return blob;
};

export const downloadAttachment = async (attachmentID) => {
    const blob = await getRequest(
        `complaints/download-attachment/${attachmentID}`,
        {},
        {
            responseType: "blob",
        }
    );
    return blob;
};

export const downloadDREAttachment = async (fileName) => {
    const blob = await getRequest(
        `dre/download/1`,
        { attachment: fileName },
        {
            responseType: "blob",
        }
    );
    return blob;
};

export const getAttachmentChecklist = () => {
    return getRequest(`/complaints/attachments/checklist`)
}

export const getAllImprovementList = () => {
    return getRequest(`/improvements/get`)
}

export const getPPMData = (payload) => {
    return getRequestWithBody("/complaints/ppm", payload);
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

export const resetPassword = (userId) => {
    return postRequest("/users/password/reset", { UserId: userId });
}

export const updatePassword = (passwordHash) => {
    return postRequest("/users/update/mypassword", { PasswordHash: passwordHash });
}

export const saveMonthlySalesData = (payload) => {
    return postRequest("/complaints/sales/entry", payload);
}

export const deleteComplaint = (complaintId) => {
    return postRequest(`/complaints/delete-complaint`, { ComplaintId: complaintId });
}

export const deleteWarrantyClaimUpload = (uploadHeadId) => {
    return getRequest(`/warranty-claims/delete/${uploadHeadId}`);
}

export const deleteDre = (dreId) => {
    return getRequest(`/dre/delete/${dreId}`);
}


