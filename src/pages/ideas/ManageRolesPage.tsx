
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { roleService } from '../../services/role.service';

interface RoleForm {
  email: string;
  role: 'EQUITY_OWNER' | 'DEBT_FINANCIER' | 'CONTRACTOR' | 'VIEWER';
  equityPercentage?: number;
  debtAmount?: number;
  startDate?: string;
  endDate?: string;
}

const roleLabels = {
  IDEA_OWNER: 'Idea Owner',
  EQUITY_OWNER: 'Equity Owner',
  DEBT_FINANCIER: 'Debt Financier',
  CONTRACTOR: 'Contractor',
  VIEWER: 'Viewer'
};

export const ManageRolesPage: React.FC = () => {
  const { id: ideaId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<RoleForm>({
    defaultValues: {
      role: 'VIEWER'
    }
  });

  const selectedRole = watch('role');

  // Fetch idea and roles data
  const { data: ideaData, isLoading } = useQuery(
    ['idea-roles', ideaId],
    () => ideaId ? roleService.getIdeaRoles(ideaId) : null,
    {
      enabled: !!ideaId
    }
  );

  // Calculate remaining equity percentage
  const totalEquity = ideaData?.users.reduce((sum, user) => 
    sum + (user.role === 'EQUITY_OWNER' ? (user.equityPercentage || 0) : 0), 0) || 0;
  const remainingEquity = 100 - totalEquity;

  // Add role mutation
  const addRoleMutation = useMutation(
    (data: RoleForm) => roleService.addRole(ideaId!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['idea-roles', ideaId]);
        reset();
      },
      onError: (err: any) => {
        setError(err?.message || 'Failed to add role');
      }
    }
  );

  // Remove role mutation
  const removeRoleMutation = useMutation(
    (userId: string) => roleService.removeRole(ideaId!, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['idea-roles', ideaId]);
        setShowDeleteDialog(false);
      },
      onError: (err: any) => {
        setError(err?.message || 'Failed to remove role');
      }
    }
  );

  const onSubmit = async (data: RoleForm) => {
    try {
      setError(null);
      await addRoleMutation.mutateAsync(data);
    } catch (err) {
      // Error handled by mutation
    }
  };

  const handleDeleteClick = (userId: string) => {
    setSelectedUser(userId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      await removeRoleMutation.mutateAsync(selectedUser);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const canManageRoles = ideaData?.users.some(u => 
    u.userId === user?.id && ['IDEA_OWNER', 'EQUITY_OWNER'].includes(u.role)
  );

  if (!canManageRoles) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          You don't have permission to manage roles for this idea
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Team Roles
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="email"
              control={control}
              rules={{ 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="User Email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              rules={{ required: 'Role is required' }}
              render={({ field }) => (
                <FormControl>
                  <InputLabel>Role</InputLabel>
                  <Select {...field} label="Role">
                    <MenuItem value="EQUITY_OWNER">Equity Owner</MenuItem>
                    <MenuItem value="DEBT_FINANCIER">Debt Financier</MenuItem>
                    <MenuItem value="CONTRACTOR">Contractor</MenuItem>
                    <MenuItem value="VIEWER">Viewer</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            {selectedRole === 'EQUITY_OWNER' && (
              <Controller
                name="equityPercentage"
                control={control}
                rules={{ 
                  required: 'Equity percentage is required',
                  min: {
                    value: 0.01,
                    message: 'Minimum equity is 0.01%'
                  },
                  max: {
                    value: remainingEquity,
                    message: `Maximum available equity is ${remainingEquity}%`
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Equity Percentage"
                    error={!!errors.equityPercentage}
                    helperText={errors.equityPercentage?.message || `Available equity: ${remainingEquity}%`}
                    InputProps={{ inputProps: { min: 0.01, max: remainingEquity, step: 0.01 } }}
                  />
                )}
              />
            )}

            {selectedRole === 'DEBT_FINANCIER' && (
              <Controller
                name="debtAmount"
                control={control}
                rules={{ 
                  required: 'Debt amount is required',
                  min: {
                    value: 1,
                    message: 'Minimum amount is 1'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Debt Amount"
                    error={!!errors.debtAmount}
                    helperText={errors.debtAmount?.message}
                    InputProps={{ inputProps: { min: 1, step: 1 } }}
                  />
                )}
              />
            )}

            {selectedRole === 'CONTRACTOR' && (
              <>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: 'Start date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startDate}
                      helperText={errors.startDate?.message}
                    />
                  )}
                />
                <Controller
                  name="endDate"
                  control={control}
                  rules={{ required: 'End date is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.endDate}
                      helperText={errors.endDate?.message}
                      inputProps={{
                        min: watch('startDate')
                      }}
                    />
                  )}
                />
              </>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={addRoleMutation.isLoading}
            >
              {addRoleMutation.isLoading ? 'Adding...' : 'Add Team Member'}
            </Button>
          </Stack>
        </form>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Current Team Members
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ideaData?.users.map((member) => (
                  <TableRow key={member.userId}>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={roleLabels[member.role as keyof typeof roleLabels]}
                        color={
                          member.role === 'IDEA_OWNER' ? 'primary' :
                          member.role === 'EQUITY_OWNER' ? 'success' :
                          member.role === 'DEBT_FINANCIER' ? 'secondary' :
                          member.role === 'CONTRACTOR' ? 'warning' : 
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {member.equityPercentage && `${member.equityPercentage}% equity`}
                      {member.debtAmount && `$${member.debtAmount.toLocaleString()} invested`}
                      {member.startDate && member.endDate && (
                        `${new Date(member.startDate).toLocaleDateString()} - ${new Date(member.endDate).toLocaleDateString()}`
                      )}
                    </TableCell>
                    <TableCell>
                      {member.role !== 'IDEA_OWNER' && (
                        <IconButton
                          onClick={() => handleDeleteClick(member.userId)}
                          disabled={removeRoleMutation.isLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Remove Team Member</DialogTitle>
        <DialogContent>
          Are you sure you want to remove this team member?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            disabled={removeRoleMutation.isLoading}
          >
            {removeRoleMutation.isLoading ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
</boltArtifact>

I've made these changes:
1. Removed MUI Date Picker dependencies
2. Replaced DatePicker with native HTML date input
3. Simplified the date handling
4. Updated types to use string for dates
5. Removed LocalizationProvider
6. Updated form validation for dates

The error should now be resolved. The page will:
1. Use native date inputs instead of MUI DatePicker
2. Handle dates properly
3. Maintain all validation and constraints
4. Work without external date picker dependencies

Let me know if you see any other issues!