import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { useDevices } from "../service/useDevice";
import { useUsers } from "../service/useUsers";
import {
  useCreateUserWiegand,
  useCreateWiegandGroup,
  useUpdateWiegandGroup,
  useUserWiegands,
  useWiegandGroups,
} from "../service/useWiegandGroup";

type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const weekdayOptions: { label: string; value: Weekday }[] = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];
const weekdayLabelMap: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

const weekdaysToBitmask = (days: Weekday[]) =>
  days.reduce((mask, day) => mask | (1 << (day - 1)), 0);

const bitmaskToWeekdays = (mask: number): Weekday[] =>
  weekdayOptions
    .map((day) => day.value)
    .filter((day) => (mask & (1 << (day - 1))) !== 0);

const timeStringToSeconds = (time: string) => {
  const [hh, mm] = time.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return hh * 3600 + mm * 60;
};

const secondsToTimeString = (seconds: number) => {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hh = String(Math.floor(total / 3600) % 24).padStart(2, "0");
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatTimeForDisplay = (value: unknown) => {
  if (typeof value === "number") return secondsToTimeString(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return secondsToTimeString(Number(trimmed));
    return trimmed || "-";
  }
  return "-";
};

const toTimeInputValue = (value: unknown) => {
  if (typeof value === "number") return secondsToTimeString(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return secondsToTimeString(Number(trimmed));
    return trimmed;
  }
  return "";
};

const normalizeUnixSeconds = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return String(numeric >= 1_000_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric));
};

const initialForm = {
  group_id: "",
  sn: "",
  timestamp: "",
  del_flag: "0",
  start: "",
  end: "",
  weekdays: [] as Weekday[],
};

const initialAssignForm = {
  sn: "",
  user_id: "",
  group_id: "",
  timestamp: "",
  del_flag: false,
};

type DeviceSnOption = {
  sn: string;
  label: string;
};

function TabPanel(props: { children?: React.ReactNode; value: number; index: number }) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const WiegandGroup = () => {
  const [tabValue, setTabValue] = useState(0);
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [snSearchText, setSnSearchText] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignSnSearchText, setAssignSnSearchText] = useState("");
  const [assignUserSearchText, setAssignUserSearchText] = useState("");
  const [assignForm, setAssignForm] = useState(initialAssignForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const debouncedSnSearchText = useDebounce(snSearchText, 400);
  const debouncedAssignSnSearchText = useDebounce(assignSnSearchText, 400);
  const debouncedAssignUserSearchText = useDebounce(assignUserSearchText, 400);
  const createWiegandGroup = useCreateWiegandGroup();
  const updateWiegandGroup = useUpdateWiegandGroup();
  const createUserWiegand = useCreateUserWiegand();
  const {
    data: userWiegandsData,
    isLoading: isUserWiegandsLoading,
    isFetching: isUserWiegandsFetching,
    isError: isUserWiegandsError,
  } = useUserWiegands();
  const { data, isLoading, isFetching, isError } = useWiegandGroups(0);
  const { data: devicesData, isLoading: isDevicesLoading } = useDevices(1, debouncedSnSearchText);
  const { data: assignDevicesData, isLoading: isAssignDevicesLoading } = useDevices(1, debouncedAssignSnSearchText);
  const { data: usersData, isLoading: isUsersLoading } = useUsers(1, 100, debouncedAssignUserSearchText);

  const snOptions: DeviceSnOption[] = Array.from(
    new Map(
      (devicesData?.data || [])
        .filter((device: any) => device?.sn)
        .map((device: any) => {
          const sn = String(device.sn);
          const deviceName = String(device?.device_name || "").trim();
          return [sn, { sn, label: deviceName || sn }];
        })
    ).values()
  );
  const assignSnOptions = Array.from(
    new Set((assignDevicesData?.data || []).map((device: any) => device?.sn).filter(Boolean))
  );

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : [];

  const handleEditRow = (row: any) => {
    setError("");
    setSuccess("");
    setIsEditMode(true);
    setSelectedId(String(row.api_id ?? row.id ?? ""));
    setForm({
      group_id: String(row.group_id ?? ""),
      sn: String(row.sn ?? ""),
      timestamp: normalizeUnixSeconds(row.timestamp),
      del_flag: String(row.del_flag ?? "0"),
      start: toTimeInputValue(row.start),
      end: toTimeInputValue(row.end),
      weekdays: Array.isArray(row.weekdaysRaw)
        ? row.weekdaysRaw
            .map((day: number) => Number(day))
            .filter((day: number) => day >= 1 && day <= 7) as Weekday[]
        : typeof row.weekdaysRaw === "number"
          ? bitmaskToWeekdays(row.weekdaysRaw)
          : [],
    });
    setSnSearchText(String(row.sn ?? ""));
    setOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "group_id", headerName: "Group ID", flex: 1 },
    { field: "sn", headerName: "SN", flex: 1.2 },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
    { field: "del_flag", headerName: "Del Flag", flex: 0.7 },
    { field: "start", headerName: "Start", flex: 0.8 },
    { field: "end", headerName: "End", flex: 0.8 },
    { field: "weekdays", headerName: "Weekdays", flex: 1.2 },
    {
      field: "action",
      headerName: "Action",
      flex: 0.6,
      sortable: false,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleEditRow(params.row)}>
          <Edit size={18} />
        </IconButton>
      ),
    },
  ];

  const rows = list.map((item: any, index: number) => {
    const firstConfig = item?.time_configs?.[0];
    const rawWeekdays = firstConfig?.weekdays;
    const weekdaysArray: Weekday[] = Array.isArray(rawWeekdays)
      ? rawWeekdays
          .map((day: number) => Number(day))
          .filter((day: number) => day >= 1 && day <= 7) as Weekday[]
      : typeof rawWeekdays === "number"
        ? bitmaskToWeekdays(rawWeekdays)
        : [];
    return {
      id: item?.id ?? `${item?.group_id || "wg"}-${index}`,
      api_id: item?.id ?? "",
      group_id: item?.group_id ?? "-",
      sn: item?.sn ?? "-",
      timestamp: item?.timestamp ?? "-",
      del_flag: item?.del_flag ?? "0",
      start: formatTimeForDisplay(firstConfig?.start),
      end: formatTimeForDisplay(firstConfig?.end),
      weekdaysRaw: rawWeekdays,
      weekdays:
        weekdaysArray.length > 0
          ? weekdaysArray.map((day: number) => weekdayLabelMap[day] || String(day)).join(", ")
          : "-",
    };
  });

  const assignList = Array.isArray(userWiegandsData)
    ? userWiegandsData
    : Array.isArray(userWiegandsData?.data)
      ? userWiegandsData.data
      : Array.isArray(userWiegandsData?.items)
        ? userWiegandsData.items
        : [];

  const assignColumns: GridColDef[] = [
    { field: "id", headerName: "ID", flex: 1.4 },
    { field: "sn", headerName: "SN", flex: 1.1 },
    { field: "user_id", headerName: "User ID", flex: 1.4 },
    { field: "group_uuid", headerName: "Group UUID", flex: 1.4 },
    { field: "group_id", headerName: "Group ID", flex: 0.8 },
    { field: "timestamp", headerName: "Timestamp", flex: 1 },
    { field: "del_flag", headerName: "Del Flag", flex: 0.8 },
  ];

  const assignRows = assignList.map((item: any, index: number) => {
    return {
      id: item?.id ?? item?.user_wiegand_id ?? `${item?.user_id || "uw"}-${index}`,
      sn: item?.sn ?? "-",
      user_id: item?.user_id ?? "-",
      group_uuid: item?.group_uuid ?? "-",
      group_id: item?.group_id ?? "-",
      timestamp: normalizeUnixSeconds(item?.timestamp) || "-",
      del_flag: typeof item?.del_flag === "boolean" ? (item.del_flag ? "true" : "false") : "-",
    };
  });

  const groupOptions = Array.from(
    new Map(
      list
        .filter((item: any) => item?.group_id)
        .map((item: any) => [item.group_id, { group_id: item.group_id, sn: item.sn || "" }])
    ).values()
  );

  const userIdOptions = Array.from(
    new Set((usersData?.data || []).map((user: any) => user?.user_id).filter(Boolean))
  );

  const handleToggleWeekday = (day: Weekday) => {
    setForm((prev) => {
      const exists = prev.weekdays.includes(day);
      return {
        ...prev,
        weekdays: exists
          ? prev.weekdays.filter((d) => d !== day)
          : [...prev.weekdays, day].sort((a, b) => a - b),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.weekdays.length === 0) {
      setError("Select at least one weekday.");
      return;
    }
    if (!form.group_id || !form.sn || !form.timestamp || !form.del_flag || !form.start || !form.end) {
      setError("Please fill all fields.");
      return;
    }

    const payload = {
      group_id: form.group_id,
      sn: form.sn,
      timestamp: Number(form.timestamp),
      del_flag: Number(form.del_flag),
      time_configs: [
        {
          start: timeStringToSeconds(form.start),
          end: timeStringToSeconds(form.end),
          weekdays: weekdaysToBitmask(form.weekdays),
        },
      ],
    };

    try {
      if (isEditMode) {
        if (!selectedId) {
          setError("Invalid record selected for update.");
          return;
        }
        await updateWiegandGroup.mutateAsync({ id: selectedId, payload });
        setSuccess("Wiegand group updated successfully.");
      } else {
        await createWiegandGroup.mutateAsync(payload);
        setSuccess("Wiegand group created successfully.");
      }
      setOpen(false);
      setForm(initialForm);
      setSelectedId("");
      setIsEditMode(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (isEditMode ? "Failed to update wiegand group." : "Failed to create wiegand group.")
      );
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");

    if (!assignForm.sn || !assignForm.user_id || !assignForm.group_id || !assignForm.timestamp) {
      setAssignError("Please fill all fields.");
      return;
    }

    try {
      await createUserWiegand.mutateAsync({
        sn: assignForm.sn,
        user_id: assignForm.user_id,
        group_id: assignForm.group_id,
        timestamp: Number(assignForm.timestamp),
        del_flag: assignForm.del_flag,
      });
      setAssignSuccess("Assigned wiegand group successfully.");
      setAssignOpen(false);
      setAssignForm(initialAssignForm);
      setAssignSnSearchText("");
      setAssignUserSearchText("");
    } catch (err: any) {
      setAssignError(err?.response?.data?.message || "Failed to assign wiegand group.");
    }
  };

  return (
    <Box className="p-4">
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 1 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Wiegand Group" className="text-primary! font-extrabold!" />
          <Tab label="Assign Wiegand Group" className="text-primary! font-extrabold!" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-primary text-4xl font-extrabold">Wiegand Group</h1>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => {
              setError("");
              setSuccess("");
              setIsEditMode(false);
              setSelectedId("");
              setSnSearchText("");
              setForm({ ...initialForm, timestamp: String(Math.floor(Date.now() / 1000)) });
              setOpen(true);
            }}
          >
            Create wiegand group
          </Button>
        </div>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && !open && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to fetch wiegand groups.
          </Alert>
        )}

        <Box sx={{ height: 560, width: "100%", mb: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading || isFetching}
            disableRowSelectionOnClick
            disableColumnSelector
            sx={{
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        </Box>

        <Dialog
          open={open}
          onClose={() => !createWiegandGroup.isPending && !updateWiegandGroup.isPending && setOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>{isEditMode ? "Edit wiegand group" : "Create wiegand group"}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                  label="Group ID"
                  value={form.group_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, group_id: e.target.value }))}
                  required
                  fullWidth
                />

                <Autocomplete<DeviceSnOption, false, true, false>
                  options={snOptions}
                  freeSolo
                  value={snOptions.find((option) => option.sn === form.sn) || (form.sn ? form.sn : null)}
                  inputValue={snSearchText}
                  onChange={(_, value) => {
                    const selectedSn = typeof value === "string" ? value : String(value?.sn || "");
                    const selectedLabel =
                      typeof value === "string" ? value : String(value?.label || selectedSn);
                    setForm((prev) => ({ ...prev, sn: selectedSn }));
                    setSnSearchText(selectedLabel);
                  }}
                  onInputChange={(_, value, reason) => {
                    setSnSearchText(value || "");
                    if (reason === "input" || reason === "clear") {
                      setForm((prev) => ({ ...prev, sn: value || "" }));
                    }
                  }}
                  getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
                  isOptionEqualToValue={(option, value) =>
                    typeof value === "string" ? option.sn === value : option.sn === value.sn
                  }
                  loading={isDevicesLoading}
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="SN"
                      required
                      fullWidth
                    />
                  )}
                />

                <TextField
                  label="Timestamp"
                  type="number"
                  value={form.timestamp}
                  onChange={(e) => setForm((prev) => ({ ...prev, timestamp: e.target.value }))}
                  required
                  disabled
                  fullWidth
                />

                <TextField
                  label="Start Time"
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm((prev) => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />

                <TextField
                  label="End Time"
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm((prev) => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  required
                  fullWidth
                />

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Weekdays
                  </Typography>
                  <FormGroup row>
                    {weekdayOptions.map((day) => (
                      <FormControlLabel
                        key={day.value}
                        control={
                          <Checkbox
                            checked={form.weekdays.includes(day.value)}
                            onChange={() => handleToggleWeekday(day.value)}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpen(false)}
                disabled={createWiegandGroup.isPending || updateWiegandGroup.isPending}
              >
                Cancel
              </Button>
              {!isEditMode ? (
                <Button type="submit" variant="contained" disabled={createWiegandGroup.isPending}>
                  {createWiegandGroup.isPending ? "Creating..." : "Create"}
                </Button>
              ) : (
                <Button type="submit" variant="contained" disabled={updateWiegandGroup.isPending}>
                  {updateWiegandGroup.isPending ? "Updating..." : "Update"}
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-primary text-4xl font-extrabold">Assign Wiegand Group</h1>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => {
              setAssignError("");
              setAssignSuccess("");
              setAssignForm({
                ...initialAssignForm,
                timestamp: String(Math.floor(Date.now() / 1000)),
                del_flag: false,
              });
              setAssignSnSearchText("");
              setAssignUserSearchText("");
              setAssignOpen(true);
            }}
          >
            Assign wiegand group
          </Button>
        </div>

        {assignSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {assignSuccess}
          </Alert>
        )}
        {assignError && !assignOpen && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {assignError}
          </Alert>
        )}
        {isUserWiegandsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to fetch assign wiegand groups.
          </Alert>
        )}

        <Box sx={{ height: 560, width: "100%", mb: 2 }}>
          <DataGrid
            rows={assignRows}
            columns={assignColumns}
            loading={isUserWiegandsLoading || isUserWiegandsFetching}
            disableRowSelectionOnClick
            disableColumnSelector
            sx={{
              "& .MuiDataGrid-cell:focus": { outline: "none" },
            }}
          />
        </Box>

        <Dialog
          open={assignOpen}
          onClose={() => !createUserWiegand.isPending && setAssignOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <form onSubmit={handleAssignSubmit}>
            <DialogTitle>Assign wiegand group</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {assignError && <Alert severity="error">{assignError}</Alert>}

                <Autocomplete
                  options={groupOptions}
                  value={groupOptions.find((option: any) => option.group_id === assignForm.group_id) || null}
                  onChange={(_, value) => {
                    const selectedGroupId = value?.group_id || "";
                    const selectedSn = value?.sn || "";
                    setAssignForm((prev) => ({
                      ...prev,
                      group_id: selectedGroupId,
                      sn: selectedSn || prev.sn,
                    }));
                    if (selectedSn) setAssignSnSearchText(selectedSn);
                  }}
                  getOptionLabel={(option: any) => option.group_id || ""}
                  isOptionEqualToValue={(a: any, b: any) => a.group_id === b.group_id}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="Group ID" required fullWidth />}
                />

                <Autocomplete
                  options={assignSnOptions}
                  freeSolo
                  value={assignForm.sn}
                  inputValue={assignSnSearchText}
                  onChange={(_, value) => {
                    const selectedSn = String(value || "");
                    setAssignForm((prev) => ({ ...prev, sn: selectedSn }));
                    setAssignSnSearchText(selectedSn);
                  }}
                  onInputChange={(_, value) => {
                    setAssignSnSearchText(value || "");
                    setAssignForm((prev) => ({ ...prev, sn: value || "" }));
                  }}
                  loading={isAssignDevicesLoading}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="SN" required fullWidth />}
                />

                <Autocomplete
                  options={userIdOptions}
                  freeSolo
                  value={assignForm.user_id}
                  inputValue={assignUserSearchText}
                  onChange={(_, value) => {
                    const selectedUserId = String(value || "");
                    setAssignForm((prev) => ({ ...prev, user_id: selectedUserId }));
                    setAssignUserSearchText(selectedUserId);
                  }}
                  onInputChange={(_, value) => {
                    setAssignUserSearchText(value || "");
                    setAssignForm((prev) => ({ ...prev, user_id: value || "" }));
                  }}
                  loading={isUsersLoading}
                  fullWidth
                  renderInput={(params) => <TextField {...params} label="User ID" required fullWidth />}
                />

                <TextField
                  label="Timestamp"
                  type="number"
                  value={assignForm.timestamp}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, timestamp: e.target.value }))}
                  disabled
                  required
                  fullWidth
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assignForm.del_flag}
                      onChange={(e) =>
                        setAssignForm((prev) => ({ ...prev, del_flag: e.target.checked }))
                      }
                    />
                  }
                  label="Del Flag (set true if needed)"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAssignOpen(false)} disabled={createUserWiegand.isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={createUserWiegand.isPending}>
                {createUserWiegand.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </TabPanel>
    </Box>
  );
};

export default WiegandGroup;
