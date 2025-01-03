import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';

interface ProfileForm {
  name: string;
  email: string;
  portfolio: string;
  skills: string;
  interests: string;
}

export const ProfilePage = () => {
  const { user, setAuth } = useAuthStore();
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      portfolio: user?.portfolio || '',
      skills: JSON.parse(user?.skills || '[]').join(', '),
      interests: JSON.parse(user?.interests || '[]').join(', ')
    }
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      setError(null);
      // TODO: Implement API call to update profile
      console.log('Update profile:', data);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Profile</Typography>
          <Button
            variant={isEditing ? "outlined" : "contained"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <TextField
              label="Name"
              disabled={!isEditing}
              {...register('name', { required: 'Name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

            <TextField
              label="Email"
              disabled={true} // Email cannot be changed
              {...register('email')}
            />

            <TextField
              label="Portfolio URL"
              disabled={!isEditing}
              {...register('portfolio')}
              error={!!errors.portfolio}
              helperText={errors.portfolio?.message}
            />

            <TextField
              label="Skills (comma-separated)"
              disabled={!isEditing}
              {...register('skills')}
              error={!!errors.skills}
              helperText={errors.skills?.message || 'Enter skills separated by commas'}
            />

            <TextField
              label="Interests (comma-separated)"
              disabled={!isEditing}
              {...register('interests')}
              error={!!errors.interests}
              helperText={errors.interests?.message || 'Enter interests separated by commas'}
            />

            {isEditing && (
              <Button type="submit" variant="contained" color="primary">
                Save Changes
              </Button>
            )}
          </Stack>
        </form>

        {!isEditing && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" gutterBottom>Skills</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {JSON.parse(user?.skills || '[]').map((skill: string) => (
                  <Chip key={skill} label={skill} sx={{ mt: 1 }} />
                ))}
              </Stack>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Interests</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {JSON.parse(user?.interests || '[]').map((interest: string) => (
                  <Chip key={interest} label={interest} sx={{ mt: 1 }} />
                ))}
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};
