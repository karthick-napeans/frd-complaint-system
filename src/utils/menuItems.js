// ============================================
// MENU CONFIGURATION (STANDARDIZED & CLEAN)
// ============================================

import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PostAddIcon from '@mui/icons-material/PostAdd';
import TimelineIcon from '@mui/icons-material/Timeline';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SummarizeIcon from '@mui/icons-material/Summarize';
import EngineeringIcon from '@mui/icons-material/Engineering';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { AccordionSummary } from '@mui/material';


// ============================================
// MENU ITEMS
// ============================================

const menuItems = [
  // =====================
  // DASHBOARD
  // =====================
  // {
  //   id: 'dashboard',
  //   label: 'Dashboard',
  //   icon: <DashboardIcon />,
  //   path: '/dashboard',
  //   roles: ['Super_Admin', 'QC Admin', 'QC User'],
  // },

  // =====================
  // FIELD REPORTS (WARRANTY)
  // =====================
  {
    id: 'warranty',
    label: 'Field Reports',
    icon: <BuildIcon />,
    path: '/warranty',
    roles: ['Super_Admin', 'QC Admin', 'QC User'],
    collapsible: true,
    submenu: [
      {
        id: 'warranty-mapper',
        label: 'Excel Template Mapper',
        icon: <CloudUploadIcon />,
        path: '/warranty/mapper',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'warranty-entry',
        label: 'Entry',
        icon: <PostAddIcon />,
        path: '/warranty/entry',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'warranty-improvement-baseline',
        label: 'Improvement Baseline',
        icon: <TimelineIcon />,
        path: '/warranty/improvement-baseline',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'warranty-analysis',
        label: 'Analysis',
        icon: <FactCheckIcon />,
        path: '/warranty/analysis',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
    ],
  },

  // =====================
  // CUSTOMER COMPLAINTS
  // =====================
  {
    id: 'complaints',
    label: 'Customer Complaints',
    icon: <PersonAddAltIcon />,
    path: '/complaints',
    roles: ['Super_Admin', 'QC Admin', 'QC User'],
    collapsible: true,
    submenu: [
      {
        id: 'complaints-entry',
        label: 'Entry',
        icon: <PostAddIcon />,
        path: '/complaints/entry',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'complaints-summary',
        label: 'Summary',
        icon: <SummarizeIcon />,
        path: '/complaints/summary',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'complaints-analysis',
        label: 'Analysis',
        icon: <FactCheckIcon />,
        path: '/complaints/analysis',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
    ],
  },

  // =====================
  // DRE
  // =====================
  {
    id: 'dre-entry',
    label: 'DRE-Entry',
    icon: <EngineeringIcon />,
    path: '/dre',
    roles: ['Super_Admin', 'QC Admin', 'QC User'],
    collapsible: true,
    submenu: [
      {
        id: 'dre-entry',
        label: 'Entry',
        icon: <PostAddIcon />,
        path: '/dre/entry',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
      {
        id: 'dre-analysis',
        label: 'Summary',
        icon: <SummarizeIcon />,
        path: '/dre/summary',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
      },
    ],
  },

  // =====================
  // MASTER DATA
  // =====================
  {
    id: 'masters',
    label: 'Master Data',
    icon: <StorageIcon />,
    path: '/masters',
    roles: ['Super_Admin', 'QC Admin'],
  },

  // =====================
  // USER MANAGEMENT
  // =====================
  {
    id: 'users',
    label: 'User Management',
    icon: <PeopleIcon />,
    path: '/users',
    roles: ['Super_Admin'],
  },

  // =====================
  // AUDIT LOGS
  // =====================
  // {
  //   id: 'audit',
  //   label: 'Audit Logs',
  //   icon: <AssignmentIcon />,
  //   path: '/audit',
  //   roles: ['Super_Admin'],
  // },
];

export default menuItems;
