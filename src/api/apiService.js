import apiClient from "./apiClient";

export const getRequest = (
    url,
    params = {},
    config = {}
) => apiClient.get(url, {
    params,
    ...config,
});

export const getRequestWithBody = (url, body = {}) =>
    apiClient.request({
        method: "GET",
        url,
        data: body,
        headers: {
            "Content-Type": "application/json",
        },
    });

export const postRequest = (url, payload) => {
    const isFormData = payload instanceof FormData;

    return apiClient.post(
        url,
        payload,
        isFormData
            ? undefined
            : {
                headers: {
                    "Content-Type": "application/json",
                },
            }
    );
};

export const putRequest = (url, data) =>
    apiClient.put(url, data);

export const deleteRequest = (url) =>
    apiClient.delete(url);
