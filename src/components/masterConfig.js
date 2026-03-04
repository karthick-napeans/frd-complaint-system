export const MASTER_CONFIG = {
    customer: {
        baseUrl: "/masters/customers",

        mapCreate: (data) => ({
            CustomerName: data.CustomerName,
            CustomerCode: data.CustomerCode,
        }),

        mapUpdate: (data) => ({
            CustomerId: data.CustomerId,
            CustomerName: data.CustomerName,
            CustomerCode: data.CustomerCode,
        }),

        mapDelete: (id) => ({
            CustomerId: id,
        }),
    },

    model: {
        baseUrl: "/masters/models",

        mapCreate: (data) => ({
            ModelCode: data.ModelCode,
            ModelName: data.ModelName,
        }),

        mapUpdate: (data) => ({
            ModelId: data.ModelId,
            ModelCode: data.ModelCode,
            ModelName: data.ModelName,
        }),


        mapDelete: (id) => ({
            ModelId: id,
        }),
    },

    part: {
        baseUrl: "/masters/parts",

        mapCreate: (data) => ({
            PartName: data.PartName,
            PartNumber: data.PartNumber,
            PartDescription: data.PartDescription,  // ✅ FIXED
        }),

        mapUpdate: (data) => ({
            PartId: data.PartId,
            PartName: data.PartName,
            PartNumber: data.PartNumber,
            PartDescription: data.PartDescription,
        }),

        mapDelete: (id) => ({
            PartId: id,
        }),
    },


    cause: {
        baseUrl: "/masters/repair-cause-codes",

        mapCreate: (data) => ({
            Code: data.Code,
            CodeDescription: data.CodeDescription,
        }),

        mapUpdate: (data) => ({
            RepairCauseCodeId: data.RepairCauseCodeId,
            Code: data.Code,
            CodeDescription: data.CodeDescription,
        }),

        mapDelete: (id) => ({
            RepairCauseCodeId: id,
        }),
    },

    attachment: {
        baseUrl: "/masters/checklist",

        mapCreate: (data) => ({
            Name: data.Name,
            IsMandatory: data.IsMandatory,
        }),

        mapUpdate: (data) => ({
            Id: data.Id,
            Name: data.Name,
            IsMandatory: data.IsMandatory,
        }),

        mapDelete: (id) => ({
            Id: id,
        }),
    }

};
