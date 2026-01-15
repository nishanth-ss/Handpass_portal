import { useState } from "react";
import { DataGrid, type GridRenderCellParams, type GridPaginationModel } from "@mui/x-data-grid";
import { useGroupManagent } from "../../service/useGroupManagement"; // your API hook
import type { Group } from "../../types/groupManagement";
import GroupDevicesDialog from "./GroupDevicesDialog";

const GroupManagementTable = () => {
    const [page, setPage] = useState(0); // 0-indexed for MUI
    const [limit, setLimit] = useState(10);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedGroupName, setSelectedGroupName] = useState("");
    const [selectGroupID,setSelectedGroupID] = useState("");

    // Fetch groups with pagination
    const { data, isFetching } = useGroupManagent(page + 1, limit); // Assuming API accepts page & limit
    const rows: Group[] = data?.data ?? [];

    const groupColumns = [
        {
            field: "group_name",
            headerName: "Group Name",
            flex: 1,
            renderCell: (params: GridRenderCellParams<Group>) => {
                const sn = params.row.devices?.[0]?.sn || "No SN";
                return (
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span>{params.value} - <strong>{sn}</strong></span>
                    </div>
                );
            },
        },
        { field: "description", headerName: "Description", flex: 2 },
        {
            field: "is_active",
            headerName: "Status",
            flex: 0.5,
            renderCell: (params: GridRenderCellParams<Group>) => (
                <span className={params.value ? "text-green-600" : "text-red-600"}>
                    {params.value ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            renderCell: (params: GridRenderCellParams<Group>) => (
                <button className="text-blue-600 hover:underline" onClick={() => handleViewClick(params.row)}
                >View</button>
            ),
        },
    ];

    const handleViewClick = (group: Group) => {
        setSelectedGroupName(group.group_name);
        setSelectedGroupID(group.id)
        setDialogOpen(true);
    };

    return (
        <div style={{ height: 500, width: "100%" }}>
            <DataGrid
                rows={rows?.map((r) => ({ ...r, id: r.id }))}
                columns={groupColumns}
                pagination
                paginationMode="server"
                rowCount={data?.pagination?.total ?? 0}
                pageSizeOptions={[5, 10, 20]}
                paginationModel={{ page, pageSize: limit }}
                onPaginationModelChange={(model: GridPaginationModel) => {
                    setPage(model.page);
                    setLimit(model.pageSize);
                }}
                loading={isFetching}
                disableRowSelectionOnClick
                disableColumnSelector
                sx={{
                    "& .MuiDataGrid-cell:focus": { outline: "none" },
                }}
            />

            {/* Device dialog */}
            <GroupDevicesDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                groupName={selectedGroupName}
                groupID={selectGroupID}
            />

        </div>
    );
};

export default GroupManagementTable;
