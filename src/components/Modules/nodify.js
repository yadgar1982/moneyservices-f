import { notification } from "antd";

export const notifySuccess = (title, description) => {
  notification.success({
    message: title,
    description,
    placement: "topRight",
    duration: 4,
  });
};

export const notifyError = (title, description) => {
  notification.error({
    message: title,
    description,
    placement: "topRight",
    duration: 5,
  });
};

export const notifyInfo = (title, description) => {
  notification.info({
    message: title,
    description,
    placement: "topRight",
    duration: 4,
  });
};

export const notifyWarning = (title, description) => {
  notification.warning({
    message: title,
    description,
    placement: "topRight",
    duration: 4,
  });
};