import { TiPlus } from 'react-icons/ti';
import { useUsers, useUpdateUser, useDeleteUser } from '../service/useUsers';
import { CommonLoader } from '../components/common/CommonLoader';
import { useState } from 'react';
import { Button } from '@mui/material';
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit, Eye, Trash } from 'lucide-react';
import { EditUserDialog } from '../components/user/EditUserDialog';
import { DeleteConfirmDialog } from '../components/common/DeleteConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import UserDetailsDialog from '../components/user/UserDetailsDialog';

const Users = () => {
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<{
    id: number;
    name: string;
    email: string;
    phone_number?: string;
    shift_id?: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const deleteMutation = useDeleteUser(); // FIX HOOK HERE
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);


  const limit = 10;
  const { data, isLoading, isError, isFetching } = useUsers(page + 1, limit);
  const updateUser = useUpdateUser();

  if (isLoading) return <CommonLoader />;
  if (isError) return <p>Error fetching users!</p>;

  const handleEdit = (row: any) => {
    setEditUser({
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      phone_number: row.phone_number ?? "",
      shift_id: row.shift_id,
    });
  };

  const columns: GridColDef[] = [
    {
      field: "username", headerName: "Name", flex: 1,
      renderCell: (param) => {
        return <h1>{param.row.name}</h1>
      }
    },
    {
      field: "userId", headerName: "User ID", flex: 1,
      renderCell: (param) => {
        return <h1>{param.row.user_id}</h1>
      }
    },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "phone_number", headerName: "Phone Number", flex: 1
    },
    {
      field: "created_at", headerName: "Created At", flex: 1,
      renderCell: (params) => (
        <span>{params.row.create_at ? new Date(params.row.create_at).toLocaleDateString() : "-"}</span>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div>
          <Button variant="text" size="small" onClick={() => handleView(params.row?.id)}>
            <Eye />
          </Button>
          <Button variant="text" size="small" onClick={() => handleEdit(params.row)}>
            <Edit />
          </Button>
          <Button variant="text" color="error" size="small" onClick={() => setSelectedId(params.row.id)}>
            <Trash />
          </Button>
        </div>
      ),
    },
  ];

  const rows = data?.data?.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone_number: user.phone_number ?? user.phone ?? "",
    user_id: user.user_id,
    create_at: user.created_at,
    sn: user?.sn,
    shift_id: user?.shift_id ? String(user.shift_id) : undefined,
    device_name: user?.device_name,
    shift_name: user?.shift_name
  }));

  const handleView = (id: string) => {
    setUserId(id);
    setOpen(true);
  }

  const handleConfirmDelete = () => {
    if (!selectedId) return;

    deleteMutation.mutate(String(selectedId), {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setSelectedId(null);
      },
    });
  };

  return (
    <div className="p-4">
      <h1 className='text-primary font-extrabold text-4xl'>User Management</h1>

      <div className='flex items-center justify-between mb-4'>
        {/* <p>Manage physical access terminals and cameras.</p> */}
        {/* <Button variant="contained" className='bg-primary!' startIcon={<TiPlus />}>
          Add New User
        </Button> */}
      </div>

      <div style={{ height: 650, width: "100%" }}>
        <DataGrid
          rows={rows || []}
          columns={columns}
          pagination
          paginationMode="server"
          rowCount={data?.pagination.total || 0}
          paginationModel={{ page, pageSize: limit }}
          onPaginationModelChange={(model) => setPage(model.page)}
          loading={isFetching}
          disableRowSelectionOnClick
          disableColumnSelector
          sx={{
            "& .MuiDataGrid-cell:focus": { outline: "none" },
          }}
        />
      </div>

      {editUser && (
        <EditUserDialog
          open={true}
          defaultName={editUser.name}
          defaultEmail={editUser.email}
          defaultPhoneNumber={editUser.phone_number}
          defaultShiftId={editUser.shift_id}
          onClose={() => setEditUser(null)}
          onSubmit={(values: any) => {
            updateUser.mutate(
              {
                id: editUser.id,
                name: values.name,
                email: values.email,
                phone_number: values.phone_number,
                shift_id: values.shift_id,
              },
              { onSuccess: () => setEditUser(null) }
            );
          }}
        />
      )}

      {/* Delete Dialogbox */}
      <DeleteConfirmDialog
        open={!!selectedId}
        onCancel={() => setSelectedId(null)}
        onConfirm={handleConfirmDelete}
        // loading={deleteMutation.isLoading}
        message="Are you sure you want to delete this user?"
      />

      {/* view user */}
      <UserDetailsDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
      />
    </div>
  );
};

export default Users;
