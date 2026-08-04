import { useEffect, useState } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import {
  Button,
  Card,
  Table,
  Space,
  message,
  Popconfirm,
  Typography,
  Statistic,
  Row,
  Col,
  Switch,
  Select,
  TimePicker,
  InputNumber,
  notification,
} from "antd";
import {
  ReloadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  DeleteOutlined,
  UndoOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Tag, Divider } from "antd";
import { http } from "../../Modules/http";
import {
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
} from "../../Modules/nodify";

const { Title } = Typography;

const Backup = () => {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [backups, setBackups] = useState([]);
  const [autoBackup, setAutoBackup] = useState({
    enabled: false,
    frequency: "daily",
    time: "02:00",
    retention: 30,
  });

  const [savingSettings, setSavingSettings] = useState(false);

  // fetch auto backup setting
  const fetchAutoBackupSettings = async () => {
    try {
      const { data } = await http().get("/api/auto-backup");

      setAutoBackup(data.settings);
    } catch (err) {
      notifyError(
        "Settings Load Failed",
        "Unable to load automatic backup settings. Please try again.",
      );
    }
  };
  // save auto backup setting
  const saveAutoBackupSettings = async () => {
    try {
      setSavingSettings(true);

      await http().put("/api/auto-backup", autoBackup);

      notifySuccess(
        "Settings Updated",
        "Automatic backup settings have been saved successfully.",
      );
    } catch (err) {
      notifyError(
        "Update Failed",
        err.response?.data?.message ||
          "Unable to save automatic backup settings. Please try again.",
      );
    } finally {
      setSavingSettings(false);
    }
  };

  // Load Backups
  const fetchBackups = async () => {
    try {
      setLoading(true);

      const { data } = await http().get("/api/backup");

      setBackups(data.backups || []);
    } catch (err) {
      notifyError(
        "Load Failed",
        err.response?.data?.message ||
          "Unable to load backup history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Create Backup
  const createBackup = async () => {
    try {
      setCreating(true);

      await http().post("/api/backup/create");

      notifySuccess(
        "Backup Created",
        "The database backup was created successfully.",
      );

      fetchBackups();
    } catch (err) {
      notifyError(
        "Backup Failed",
        err.response?.data?.message || "Unable to create the database backup.",
      );
    } finally {
      setCreating(false);
    }
  };

  // Restore Backup
  const restoreBackup = async (id) => {
    try {
      setLoading(true);

      await http().post(`/api/backup/restore/${id}`);

      notifySuccess(
        "Database Restored",
        "The selected backup has been restored successfully.",
      );

      fetchBackups();
    } catch (err) {
      notifyError(
        "Restore Failed",
        err.response?.data?.message || "Unable to restore the selected backup.",
      );
    } finally {
      setLoading(false);
    }
  };

  //   Delete Backup
  const deleteBackup = async (id) => {
    try {
      setLoading(true);

      await http().delete(`/api/backup/${id}`);

      notifySuccess(
        "Backup Deleted",
        "The selected backup has been deleted successfully.",
      );

      fetchBackups();
    } catch (err) {
      notifyError(
        "Delete Failed",
        err.response?.data?.message || "Unable to delete the selected backup.",
      );
    } finally {
      setLoading(false);
    }
  };

  //   download
  const downloadBackup = (id) => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/backup/download/${id}`,
      "_blank",
    );
  };

  useEffect(() => {
    fetchBackups();
    fetchAutoBackupSettings();
  }, []);
  const columns = [
    {
      title: "Backup Name",
      dataIndex: "backupName",
    },
    {
      title: "Collections",
      dataIndex: "totalCollections",
      align: "center",
    },
    {
      title: "Records",
      dataIndex: "totalRecords",
      align: "center",
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      title: "Action",
      align: "center",
      width: 240,
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Restore Database"
            description="This will replace the current database with the selected backup."
            okText="Restore"
            cancelText="Cancel"
            onConfirm={() => restoreBackup(record._id)}
          >
            <Button
              type="primary"
              icon={<UndoOutlined />}
              className="!rounded-lg"
            >
              Restore
            </Button>
          </Popconfirm>

          {/* Download button (implement later) */}
          <Button
            icon={<DownloadOutlined />}
            className="!rounded-lg"
            onClick={() => downloadBackup(record._id)}
          >
            Download
          </Button>

          <Popconfirm
            title="Delete Backup"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteBackup(record._id)}
          >
            <Button danger icon={<DeleteOutlined />} className="!rounded-lg">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <Card className="!rounded-2xl !shadow-lg !border-0 !bg-slat-100">
          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 mb-8">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 sm:p-8 lg:p-10 shadow-2xl">
              {/* Decorative Background */}
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl"></div>

              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Content */}
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white text-sm font-medium backdrop-blur-md mb-5">
                    <DatabaseOutlined />
                    Backup & Disaster Recovery
                  </div>

                  <Title
                    level={2}
                    style={{
                      color: "#fff",
                      marginBottom: 12,
                      fontWeight: 700,
                    }}
                  >
                    Database Backup & Restore
                  </Title>

                  <p className="text-emerald-50 text-base sm:text-lg leading-8 max-w-2xl">
                    Secure your database with automatic backups, instant
                    recovery, and reliable protection against data loss.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-8">
                    <Tag
                      color="success"
                      className="!px-4 !py-1 !rounded-full !text-sm"
                    >
                      Automatic Backup
                    </Tag>

                    <Tag
                      color="processing"
                      className="!px-4 !py-1 !rounded-full !text-sm"
                    >
                      Instant Restore
                    </Tag>

                    <Tag
                      color="cyan"
                      className="!px-4 !py-1 !rounded-full !text-sm"
                    >
                      Secure Recovery
                    </Tag>
                  </div>
                </div>

                {/* Right Icon */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl scale-125"></div>

                    <div className="relative h-40 w-40 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center">
                      <DatabaseOutlined
                        style={{
                          fontSize: 90,
                          color: "#fff",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
              <Button
                size="large"
                loading={loading}
                onClick={fetchBackups}
                icon={<ReloadOutlined />}
                className="
      !h-14
      !rounded-2xl
      !px-8
      !font-semibold
      !border-0
      !bg-cyan-300
      !text-slate-700
      hover:!bg-slate-100
      hover:!text-emerald-700
      !shadow-lg
      hover:!shadow-xl
      transition-all
      duration-300
      w-full
      xl:w-auto
    "
              >
                Refresh
              </Button>

              <Button
                size="large"
                type="primary"
                loading={creating}
                onClick={createBackup}
                icon={<DatabaseOutlined />}
                className="
      !h-14
      !rounded-2xl
      !px-8
      !font-semibold
      !border-0
      !bg-white
      !text-emerald-700
      hover:!bg-emerald-50
      hover:!scale-105
      !shadow-xl
      transition-all
      duration-300
      w-full
      xl:w-auto
    "
              >
                Create Backup
              </Button>
            </div>
          </div>

          {/* Statistics */}

          <Row gutter={[20, 20]} className="mb-8">
            <Col xs={24} sm={12} lg={12} xl={6}>
              <Card className="!rounded-2xl shadow-md hover:shadow-xl transition-all">
                <Statistic
                  title="Total Backups"
                  value={backups.length}
                  prefix={<FolderOpenOutlined style={{ color: "#1677ff" }} />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={12} xl={6}>
              <Card className="!rounded-2xl shadow-md hover:shadow-xl transition-all">
                <Statistic
                  title="Collections"
                  value={6}
                  prefix={<DatabaseOutlined style={{ color: "#52c41a" }} />}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={12} xl={6}>
              <Card className="!rounded-2xl shadow-md hover:shadow-xl transition-all">
                <Statistic
                  title="Last Backup"
                  value={
                    backups.length
                      ? new Date(backups[0].createdAt).toLocaleDateString()
                      : "--"
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={12} xl={6}>
              <Card className="!rounded-2xl shadow-md hover:shadow-xl transition-all">
                <Statistic
                  title="Status"
                  value="Healthy"
                  prefix={<CheckCircleOutlined style={{ color: "#22c55e" }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Auto backup */}
          <Card
            title="Automatic Backup Settings"
            className="!rounded-2xl !shadow-md mb-6"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Enable Automatic Backup</span>

                  <Switch
                    checked={autoBackup.enabled}
                    onChange={(checked) =>
                      setAutoBackup({
                        ...autoBackup,
                        enabled: checked,
                      })
                    }
                  />
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div>
                  <label className="font-semibold block mb-2">Frequency</label>

                  <Select
                    value={autoBackup.frequency}
                    style={{ width: "100%" }}
                    onChange={(value) =>
                      setAutoBackup({
                        ...autoBackup,
                        frequency: value,
                      })
                    }
                    options={[
                      {
                        value: "daily",
                        label: "Daily",
                      },
                      {
                        value: "weekly",
                        label: "Weekly",
                      },
                      {
                        value: "monthly",
                        label: "Monthly",
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={24} md={12}>
                <label className="font-semibold block mb-2">Backup Time</label>

                <TimePicker
                  use12Hours
                  format="h:mm A"
                  value={dayjs(autoBackup.time, "HH:mm")}
                  style={{ width: "100%" }}
                  onChange={(time) =>
                    setAutoBackup({
                      ...autoBackup,
                      time: time.format("HH:mm"), // Still saves 24-hour format
                    })
                  }
                />
              </Col>

              <Col xs={24} md={12}>
                <label className="font-semibold block mb-2">
                  Keep Last Backups
                </label>

                <InputNumber
                  min={1}
                  max={365}
                  style={{ width: "100%" }}
                  value={autoBackup.retention}
                  onChange={(value) =>
                    setAutoBackup({
                      ...autoBackup,
                      retention: value,
                    })
                  }
                />
              </Col>

              <Col span={24}>
                <Button
                  type="primary"
                  size="large"
                  loading={savingSettings}
                  onClick={saveAutoBackupSettings}
                >
                  Save Settings
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Table */}

         <div className="my-2">
           <Table
            rowKey="_id"
            loading={loading}
            dataSource={backups}
            columns={columns}
            bordered
            scroll={{ x: 1100 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              responsive: true,
            }}
          />
         </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Backup;
