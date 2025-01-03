import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { ideaService } from '../../services/idea.service';

const roleColors: Record<string, "default" | "primary" | "secondary" | "success" | "warning"> = {
  IDEA_OWNER: "primary",
  EQUITY_OWNER: "success",
  DEBT_FINANCIER: "secondary",
  CONTRACTOR: "warning",
  VIEWER: "default"
};

export const ViewIdeaPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideaService.getIdea(id!),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !idea) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          Failed to load idea details. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            {idea.name}
          </Typography>
          <Stack direction="row" spacing={2}>
            {idea.userRole === 'IDEA_OWNER' && (
              <Button
                variant="outlined"
                startIcon={<GroupIcon />}
                onClick={() => navigate(`/ideas/${id}/roles`)}
              >
                Manage Team
              </Button>
            )}
            {['IDEA_OWNER', 'EQUITY_OWNER'].includes(idea.userRole) && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/ideas/${id}/edit`)}
              >
                Edit
              </Button>
            )}
          </Stack>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Typography variant="overline" color="textSecondary">
              Category
            </Typography>
            <Typography variant="h6">
              {idea.problemCategory}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="overline" color="textSecondary">
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {idea.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="overline" color="textSecondary">
              Solution
            </Typography>
            <Typography variant="body1" paragraph>
              {idea.solution}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  label={`${idea.userRole.replace('_', ' ')}${
                    idea.equityPercentage ? ` (${idea.equityPercentage}%)` : ''
                  }`}
                  color={roleColors[idea.userRole]}
                />
                <Typography variant="body2" color="textSecondary">
                  {idea.teamSize} team member{idea.teamSize !== 1 ? 's' : ''}
                </Typography>
              </Stack>
              <Chip
                label={idea.visibility}
                color={idea.visibility === 'public' ? 'success' : 'default'}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="textSecondary">
                Created: {new Date(idea.createdAt).toLocaleDateString()}
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};
