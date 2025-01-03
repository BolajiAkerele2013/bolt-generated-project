import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  CircularProgress
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ideaService } from '../../services/idea.service';

interface IdeaForm {
  name: string;
  description: string;
  problemCategory: string;
  solution: string;
  visibility: 'public' | 'private';
}

const categories = [
  'Technology',
  'Healthcare',
  'Education',
  'Environment',
  'Finance',
  'Social Impact',
  'Entertainment',
  'Other'
];

export const EditIdeaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);

  const { data: idea, isLoading: isLoadingIdea } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaService.getIdea(id!),
    enabled: !!id,
    onSuccess: (data) => {
      if (data) {
        reset({
          name: data.name,
          description: data.description,
          problemCategory: data.problemCategory,
          solution: data.solution,
          visibility: data.visibility
        });
      }
    }
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<IdeaForm>();

  const updateIdeaMutation = useMutation({
    mutationFn: (data: IdeaForm) => ideaService.updateIdea(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['idea', id]);
      queryClient.invalidateQueries(['user-ideas']);
      navigate(`/ideas/${id}`);
    },
    onError: (err: any) => {
      setError(err?.error || 'Failed to update idea');
    }
  });

  if (isLoadingIdea) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!idea) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          Failed to load idea details
        </Alert>
      </Container>
    );
  }

  const onSubmit = async (data: IdeaForm) => {
    try {
      setError(null);
      await updateIdeaMutation.mutateAsync(data);
    } catch (err) {
      // Error handled by mutation
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Edit Idea
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Idea name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Idea Name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="problemCategory"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <FormControl error={!!errors.problemCategory}>
                  <InputLabel>Problem Category</InputLabel>
                  <Select {...field} label="Problem Category">
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  multiline
                  rows={4}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="solution"
              control={control}
              rules={{ required: 'Solution is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Solution"
                  multiline
                  rows={4}
                  error={!!errors.solution}
                  helperText={errors.solution?.message}
                />
              )}
            />

            <Controller
              name="visibility"
              control={control}
              render={({ field }) => (
                <FormControl>
                  <InputLabel>Visibility</InputLabel>
                  <Select {...field} label="Visibility">
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="public">Public</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/ideas/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={updateIdeaMutation.isLoading}
              >
                {updateIdeaMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};
