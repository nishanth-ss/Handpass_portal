import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  name: yup.string().required("Name is required"),
});

type EditUserDialogProps = {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  onSubmit: (values: { name: string }) => void;
};

export const EditUserDialog = ({ open, onClose, defaultName, onSubmit }: EditUserDialogProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: defaultName },
    resolver: yupResolver(schema),
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message?.toString()}
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
