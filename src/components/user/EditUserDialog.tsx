import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";
import { useShift } from "../../service/useSettings";
import type { ShiftConfig } from "../../types/settingTypes";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Enter a valid email").required("Email is required"),
  shift_id: yup.string().defined(),
});

type EditUserFormValues = {
  name: string;
  email: string;
  shift_id: string;
};

type EditUserDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  defaultEmail: string;
  defaultShiftId?: string;
  onSubmit: (values: { name: string; email: string; shift_id?: string }) => void;
};

const getShiftId = (shift: ShiftConfig | null | undefined): string => {
  const id = shift?.id ?? shift?._id;
  return id !== undefined && id !== null ? String(id) : "";
};

const getShiftLabel = (shift: ShiftConfig): string =>
  `${shift.shift_name ?? "Shift"} (${shift.start_time ?? "--:--"} - ${shift.end_time ?? "--:--"})`;

export const EditUserDialog = ({
  open,
  onClose,
  defaultName,
  defaultEmail,
  defaultShiftId,
  onSubmit,
}: EditUserDialogProps) => {
  const { data: shifts = [], isLoading: isShiftLoading } = useShift(open);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditUserFormValues>({
    defaultValues: {
      name: defaultName,
      email: defaultEmail,
      shift_id: defaultShiftId ?? "",
    },
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    reset({
      name: defaultName,
      email: defaultEmail,
      shift_id: defaultShiftId ?? "",
    });
  }, [defaultName, defaultEmail, defaultShiftId, reset]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <form
        onSubmit={handleSubmit((values) =>
          onSubmit({
            name: values.name,
            email: values.email,
            shift_id: values.shift_id || undefined,
          }),
        )}
      >
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message?.toString()}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message?.toString()}
          />
          <Controller
            control={control}
            name="shift_id"
            render={({ field }) => (
              <Autocomplete
                options={shifts}
                loading={isShiftLoading}
                value={shifts.find((shift) => getShiftId(shift) === (field.value ?? "")) ?? null}
                onChange={(_, value) => field.onChange(getShiftId(value))}
                getOptionLabel={getShiftLabel}
                isOptionEqualToValue={(option, value) => getShiftId(option) === getShiftId(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Shift"
                    margin="normal"
                    fullWidth
                    placeholder={isShiftLoading ? "Loading shifts..." : "Select shift"}
                  />
                )}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} variant="contained">Save</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
