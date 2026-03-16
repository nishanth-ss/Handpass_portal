import { useUsers, useUpdateUser, useDeleteUser } from '../service/useUsers';
import { CommonLoader } from '../components/common/CommonLoader';
import { useState } from 'react';
import { Box, Button } from '@mui/material';
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Edit, Eye, Trash } from 'lucide-react';
import { EditUserDialog } from '../components/user/EditUserDialog';
import { DeleteConfirmDialog } from '../components/common/DeleteConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import UserDetailsDialog from '../components/user/UserDetailsDialog';
import type { UserData, UserGroup } from '../types/userTypes';

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  groups: UserGroup[];
  user_id?: string;
  create_at?: string;
  sn?: string;
  admin_auth: number;
  device_name?: string;
  shift_name?: string;
};

const Users = () => {
  const [page, setPage] = useState(0);
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    admin_auth: number;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deleteMutation = useDeleteUser(); // FIX HOOK HERE
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [open, setOpen] = useState(false);


  const limit = 10;
  const { data, isLoading, isError, isFetching } = useUsers(page + 1, limit);
  const updateUser = useUpdateUser();

  if (isLoading) return <CommonLoader />;
  if (isError) return <p>Error fetching users!</p>;

  const handleEdit = (row: UserRow) => {
    updateUser.reset();
    setEditUser({
      id: row.id,
      name: row.name,
      email: row.email ?? "",
      phone_number: row.phone_number ?? "",
      admin_auth: Number(row.admin_auth ?? 0),
    });
  };

  const columns: GridColDef[] = [
    {
      field: "username", headerName: "Name", flex: 0.7,
      renderCell: (param) => {
        return <h1>{param.row.name}</h1>
      }
    },
    {
      field: "userId", headerName: "User ID", flex: 0.7,
      renderCell: (param) => {
        return <h1>{param.row.user_id}</h1>
      }
    },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "phone_number", headerName: "Phone Number", flex: 0.7
    },
    {
      field: "groups",
      headerName: "Groups",
      flex: 1.3,
      sortable: false,
      renderCell: (params) => {
        const groups: UserGroup[] = params.row.groups ?? [];

        if (groups.length === 0) {
          return <span className="text-gray-500 text-sm">No group assigned</span>;
        }

        return (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.75,
              py: 1,
              alignItems: "center",
            }}
          >
            {groups.map((group) => (
              <Box
                key={group.group_id}
                sx={{
                  px: 1,
                  py: 0.4,
                  borderRadius: "999px",
                  backgroundColor: "#eef4ff",
                  color: "#1d4ed8",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  border: "1px solid #bfdbfe",
                }}
              >
                {group.group_id}
              </Box>
            ))}
          </Box>
        );
      }
    },
    {
      field: "admin_auth",
      headerName: "Admin Auth",
      flex: 0.5,
      renderCell: (params) => (
        <span>{Number(params.row.admin_auth) === 0 ? "false" : "true"}</span>
      ),
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

  const rows: UserRow[] = (data?.data || []).map((user: UserData & {
    phone?: string;
    device_name?: string;
    shift_name?: string;
  }) => ({
    id: user.id,
    name: user.name,
    email: user.email ?? "",
    phone_number: user.phone_number ?? user.phone ?? "",
    groups: user.groups ?? [],
    user_id: user.user_id,
    create_at: user.created_at,
    sn: user?.sn,
    admin_auth: Number(user?.admin_auth ?? 0),
    device_name: user?.device_name,
    shift_name: user?.shift_name
  }));

  const handleView = (id: string) => {
    setUserId(id);
    setOpen(true);
  }

  const handleConfirmDelete = () => {
    if (!selectedId) return;

    deleteMutation.mutate(selectedId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setSelectedId(null);
      },
    });
  };

  const updateErrorMessage = (() => {
    if (!updateUser.error) return null;
    if (axios.isAxiosError(updateUser.error)) {
      return (
        updateUser.error.response?.data?.msg ||
        updateUser.error.response?.data?.message ||
        updateUser.error.message ||
        "Failed to update user."
      );
    }
    if (updateUser.error instanceof Error) {
      return updateUser.error.message;
    }
    return "Failed to update user.";
  })();

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
          getRowHeight={() => "auto"}
          sx={{
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-cell": {
              alignItems: "center",
            },
          }}
        />
      </div>

      {editUser && (
        <EditUserDialog
          open={true}
          defaultName={editUser.name}
          defaultEmail={editUser.email}
          defaultPhoneNumber={editUser.phone_number}
          defaultAdminAuth={editUser.admin_auth}
          submitError={updateErrorMessage}
          isSaving={updateUser.isPending}
          onClose={() => {
            updateUser.reset();
            setEditUser(null);
          }}
          onSubmit={(values) => {
            updateUser.mutate(
              {
                id: String(editUser.id),
                name: values.name,
                email: values.email,
                phone_number: values.phone_number,
                admin_auth: values.admin_auth,
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
