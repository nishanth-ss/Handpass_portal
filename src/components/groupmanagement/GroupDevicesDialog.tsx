import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { IoIosCloseCircle } from "react-icons/io";
import { useGroupViewMember } from "../../service/useGroupManagement";

interface GroupDevicesDialogProps {
    open: boolean;
    onClose: () => void;
    devices: any[];
    groupName: string;
    groupID: string;
}

const GroupDevicesDialog: React.FC<GroupDevicesDialogProps> = ({
    open,
    onClose,
    devices,
    groupName,
    groupID
}) => {
    const columns: GridColDef[] = [
        { field: "device_name", headerName: "Device Name", flex: 1 },
        { field: "sn", headerName: "Serial Number", flex: 1 },
        { field: "device_ip", headerName: "Device IP", flex: 1 },
        { field: "group_name", headerName: "Group Name", flex: 1 },
    ];

    const [page, setPage] = useState(0); // 0-indexed for MUI
    const [limit, setLimit] = useState(10);

    const { data } = useGroupViewMember(page,limit,groupID);
    console.log(data);


    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Devices for {groupName}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                >
                    <IoIosCloseCircle color="red" />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <div style={{ height: 400, width: "100%" }}>
                    <DataGrid
                        rows={devices.map((d) => ({ ...d, id: d.device_id }))}
                        columns={columns}
                        pageSizeOptions={[5, 10, 20]}
                        pagination
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default GroupDevicesDialog;
