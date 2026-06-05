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

        mapDelete: (id, isActive) => ({
            CustomerId: id,
            IsActive: isActive,
        }),
    },

    model: {
        baseUrl: "/masters/models",

        mapCreate: (data) => ({
            ModelCode: data.ModelName,
            ModelName: data.ModelName,
        }),

        mapUpdate: (data) => ({
            ModelId: data.ModelId,
            ModelCode: data.ModelName,
            ModelName: data.ModelName,
        }),


        mapDelete: (id, isActive) => ({
            ModelId: id,
            IsActive: isActive,
        }),
    },

    part: {
        baseUrl: "/masters/parts",

        mapCreate: (data) => ({
            PartName: data.PartName,
            PartNumber: data.PartNumber,
        }),

        mapUpdate: (data) => ({
            PartId: data.PartId,
            PartName: data.PartName,
            PartNumber: data.PartNumber,
        }),

        mapDelete: (id, isActive) => ({
            PartId: id,
            IsActive: isActive,
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

        mapDelete: (id, isActive) => ({
            RepairCauseCodeId: id,
            IsActive: isActive,
        }),
    },

    nature: {
        baseUrl: "/masters/nature-code",

        mapCreate: (data) => ({
            Code: data.Code,
            CodeDescription: data.CodeDescription,
        }),

        mapUpdate: (data) => ({
            NatureCodeId: data.NatureCodeId,
            Code: data.Code,
            CodeDescription: data.CodeDescription,
        }),

        mapDelete: (id, isActive) => ({
            NatureCodeId: id,
            IsActive: isActive,
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

        mapDelete: (id, isActive) => ({
            Id: id,
            IsActive: isActive,
        }),
    },

    defect: {
        baseUrl: "/masters/defect",

        mapCreate: (data) => ({
            Defect: data.Defect,
        }),

        mapUpdate: (data) => ({
            DefectId: data.DefectId,
            Defect: data.Defect,
        }),

        mapDelete: (id, isActive) => ({
            DefectId: id,
            IsActive: isActive,
        }),
    }
};
