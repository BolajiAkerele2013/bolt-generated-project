import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Fab,
  IconButton,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
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

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { data: ideas = [], isLoading, isError, error } = useQuery({
    queryKey: ['user-ideas'],
    queryFn: () => ideaService.getUserIdeas(),
    retry: 1,
    refetchOnWindowFocus: false
  });

  const getRoleDisplay = (idea: any) => {
    let label = idea.userRole.replace('_', ' ');
    if (idea.equityPercentage !== undefined) {
      label += ` (${idea.equityPercentage}%)`;
    } else if (idea.debtAmount !== undefined) {
      label += ` ($${idea.debtAmount.toLocaleString()})`;
    }
    return label;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load ideas. Please try again later.
          {error instanceof Error && `: ${error.message}`}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">My Ideas</Typography>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => navigate('/ideas/new')}
        >
          <AddIcon />
        </Fab>
      </Box>

      {ideas.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            You don't have any ideas yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/ideas/new')}
            sx={{ mt: 2 }}
          >
            Create Your First Idea
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {ideas.map((idea) => (
            <Grid item xs={12} md={6} key={idea.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" gutterBottom>
                      {idea.name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {idea.userRole === 'IDEA_OWNER' && (
                        <IconButton 
                          size="small" 
                          onClick={() => navigate(`/ideas/${idea.id}/roles`)}
                          title="Manage Team"
                        >
                          <GroupIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/ideas/${idea.id}/edit`)}
                        title="Edit Idea"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => navigate(`/ideas/${idea.id}`)}
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Stack>
                  </Box>
                  
                  <Typography color="textSecondary" gutterBottom>
                    {idea.problemCategory}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {idea.description}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary">
                      {idea.teamSize} team member{idea.teamSize !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" color="action" />
                      <Chip
                        label={getRoleDisplay(idea)}
                        color={roleColors[idea.userRole]}
                        size="small"
                      />
                    </Stack>
                    <Chip
                      label={idea.visibility}
                      color={idea.visibility === 'public' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    Created: {new Date(idea.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};
