import { TiPlus } from "react-icons/ti";
import { useDeleteDevice, useDevices, useUpdateDevice } from "../service/useDevice";
import { DeviceCard } from "../components/device/DeviceCard";
import { useState } from "react";
import EditDeviceDialog from "../components/device/EditDeviceDialog";
import { CommonLoader } from "../components/common/CommonLoader";
import { DeleteConfirmDialog } from "../components/common/DeleteConfirmDialog";
import { Button } from "@mui/material";


const Devices = () => {
  const { data, isLoading, error } = useDevices();
  const updateMutation = useUpdateDevice();
  const deleteMutation = useDeleteDevice();

  const [selected, setSelected] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleEdit = (device: any) => {
    setSelected(device);
    setOpen(true);
  };

  const handleUpdate = (id: string, name: string) => {
    updateMutation.mutate(
      { id, name },
      {
        onSuccess: () => {
          console.log("Updated successfully");
          setOpen(false);
          setSelected(null);
        },
        onError: (err) => {
          console.error(err);
        },
      }
    );
  };

  const handleDeleteClick = (device: any) => {
    setSelectedId(device.id);
  };

  const handleConfirmDelete = () => {
    if (!selectedId) return;
    deleteMutation.mutate(selectedId, {
      onSuccess: () => setSelectedId(null)
    });
  };



  if (isLoading) return <CommonLoader />;

  if (error) return <p className="text-red-500">Failed to load devices</p>;

  return (
    <div>
      <h1 className='text-primary font-extrabold text-4xl mb-2'>Device Management</h1>
      <div className='flex items-center justify-between'>
        <p>Manage physical access terminals and cameras.</p>
        <Button variant="contained" className='bg-primary!' startIcon={<TiPlus />}>
          Register Device
        </Button>
      </div>

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {data?.data?.map((device) => (
          <DeviceCard key={device.id} device={device} onEdit={handleEdit} onDelete={handleDeleteClick} />
        ))}
      </div>


      {/* Edit Dialogbox */}
      <EditDeviceDialog
        open={open}
        onClose={() => setOpen(false)}
        device={selected}
        onUpdate={handleUpdate}
      />

      {/* Delete Dialogbox */}
      <DeleteConfirmDialog
        open={!!selectedId}
        onCancel={() => setSelectedId(null)}
        onConfirm={handleConfirmDelete}
        // loading={deleteMutation.isLoading}
        message="Are you sure you want to delete this device?"
      />

    </div>
  )
}

export default Devices