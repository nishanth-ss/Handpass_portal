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
  TextField,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { useDevices } from "../service/useDevice";
import {
  useCreateWiegandGroup,
  useUpdateWiegandGroup,
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

const initialForm = {
  group_id: "",
  sn: "",
  timestamp: "",
  del_flag: "0",
  start: "",
  end: "",
  weekdays: [] as Weekday[],
};

const WiegandGroup = () => {
  const [open, setOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [snSearchText, setSnSearchText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);
  const debouncedSnSearchText = useDebounce(snSearchText, 400);
  const createWiegandGroup = useCreateWiegandGroup();
  const updateWiegandGroup = useUpdateWiegandGroup();
  const { data, isLoading, isFetching, isError } = useWiegandGroups(0);
  const { data: devicesData, isLoading: isDevicesLoading } = useDevices(1, debouncedSnSearchText);

  const snOptions = Array.from(
    new Set((devicesData?.data || []).map((device: any) => device?.sn).filter(Boolean))
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
      timestamp: String(row.timestamp ?? ""),
      del_flag: String(row.del_flag ?? "0"),
      start: String(row.start ?? ""),
      end: String(row.end ?? ""),
      weekdays: Array.isArray(row.weekdaysRaw)
        ? row.weekdaysRaw
            .map((day: number) => Number(day))
            .filter((day: number) => day >= 1 && day <= 7) as Weekday[]
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
    return {
      id: item?.id ?? `${item?.group_id || "wg"}-${index}`,
      api_id: item?.id ?? "",
      group_id: item?.group_id ?? "-",
      sn: item?.sn ?? "-",
      timestamp: item?.timestamp ?? "-",
      del_flag: item?.del_flag ?? "0",
      start: firstConfig?.start ?? "-",
      end: firstConfig?.end ?? "-",
      weekdaysRaw: Array.isArray(firstConfig?.weekdays) ? firstConfig.weekdays : [],
      weekdays: Array.isArray(firstConfig?.weekdays)
        ? firstConfig.weekdays
            .map((day: number) => weekdayLabelMap[day] || String(day))
            .join(", ")
        : "-",
    };
  });

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
          start: form.start,
          end: form.end,
          weekdays: form.weekdays,
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

  return (
    <Box className="p-4">
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
            setForm({ ...initialForm, timestamp: String(Date.now()) });
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

              <Autocomplete
                options={snOptions}
                freeSolo
                value={form.sn}
                inputValue={snSearchText}
                onChange={(_, value) => {
                  const selectedSn = String(value || "");
                  setForm((prev) => ({ ...prev, sn: selectedSn }));
                  setSnSearchText(selectedSn);
                }}
                onInputChange={(_, value) => {
                  setSnSearchText(value || "");
                  setForm((prev) => ({ ...prev, sn: value || "" }));
                }}
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
                fullWidth
              />

              {/* <TextField
                label="Del Flag"
                type="number"
                value={form.del_flag}
                onChange={(e) => setForm((prev) => ({ ...prev, del_flag: e.target.value }))}
                inputProps={{ min: 0 }}
                required
                fullWidth
              /> */}

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
            ) :
             <Button type="submit" variant="contained" disabled={updateWiegandGroup.isPending}>
                {updateWiegandGroup.isPending ? "Updating..." : "Update"}
              </Button>
            }
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default WiegandGroup;
