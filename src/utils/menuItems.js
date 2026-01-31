// ============================================
// MENU CONFIGURATION - Complete menuItems const
// ============================================
// Copy this entire code and replace in your Sidebar.js or App.js

import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmailIcon from '@mui/icons-material/Email';
import EngineeringIcon from '@mui/icons-material/Engineering';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// ============================================
// MENU ITEMS CONFIGURATION
// ============================================

const menuItems = [
  // ============================================
  // 1. DASHBOARD
  // ============================================
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['Super_Admin', 'QC Admin', 'QC User'],
    submenu: null,
    description: 'View system overview and key metrics'
  },

  // ============================================
  // 2. WARRANTY CLAIM REPAIR DATA MANAGEMENT MODULE
  // ============================================
  {
    id: 'warranty',
    label: 'Field Reports',
    icon: <BuildIcon />,
    path: '/warranty',
    roles: ['Super_Admin', 'QC Admin'],
    collapsible: true,
    submenu: [
      {
        id: 'warranty-mapper',
        label: 'Master Excel Template Mapper',
        icon: <CloudUploadIcon />,
        path: '/warranty/mapper',
        roles: ['Super_Admin', 'QC Admin'],
        description: 'Map customer Excel templates to master template'
      },
      {
        id: 'warranty-entry',
        label: 'Entry',
        icon: <CloudUploadIcon />,
        path: '/warranty/entry',
        roles: ['Super_Admin', 'QC Admin'],
        description: 'Upload and process warranty claim data'
      },
      {
        id: 'warranty-analysis',
        label: 'Analysis',
        icon: <AssessmentIcon />,
        path: '/warranty/analysis',
        roles: ['Super_Admin', 'QC Admin'],
        description: 'View warranty trends and analytics'
      }
    ]
  },

  // ============================================
  // 3. CUSTOMER COMPLAINTS MODULE
  // ============================================
  {
    id: 'complaints',
    label: 'Customer Complaints',
    icon: <EmailIcon />,
    path: '/complaints',
    roles: ['Super_Admin', 'QC Admin', 'QC User'],
    collapsible: true,
    submenu: [
      {
        id: 'complaints-entry',
        label: 'Entry',
        icon: <EmailIcon />,
        path: '/complaints/entry',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
        description: 'Create and manage customer complaints'
      },
      {
        id: 'complaints-analysis',
        label: 'Analysis',
        icon: <AssessmentIcon />,
        path: '/complaints/analysis',
        roles: ['Super_Admin', 'QC Admin', 'QC User'],
        description: 'View complaint analysis and trends'
      }
    ]
  },

  // ============================================
  // 4. DRE (DESIGN RESOLUTION ENGINEER) MODULE
  // ============================================
  {
    id: 'dre',
    label: 'DRE',
    icon: <EngineeringIcon />,
    path: '/dre',
    roles: ['Super_Admin', 'QC Admin'],
    collapsible: true,
    submenu: [
      {
        id: 'dre-entry',
        label: 'Entry',
        icon: <EngineeringIcon />,
        path: '/dre/entry',
        roles: ['Super_Admin', 'QC Admin'],
        description: 'Create DRE entries (form or Excel upload)'
      },
      {
        id: 'dre-analysis',
        label: 'Analysis',
        icon: <AssessmentIcon />,
        path: '/dre/analysis',
        roles: ['Super_Admin', 'QC Admin'],
        description: 'View DRE case analysis and reports'
      }
    ]
  },

  // ============================================
  // 5. MASTER DATA MANAGEMENT
  // ============================================
  {
    id: 'masters',
    label: 'Master Data',
    icon: <StorageIcon />,
    path: '/masters',
    roles: ['Super_Admin', 'QC Admin'],
    submenu: null,
    description: 'Manage customers, models, parts, codes'
  },

  // ============================================
  // 6. USER MANAGEMENT
  // ============================================
  {
    id: 'users',
    label: 'User Management',
    icon: <PeopleIcon />,
    path: '/users',
    roles: ['Super_Admin'],
    submenu: null,
    description: 'Create and manage users'
  },

  // ============================================
  // 7. AUDIT LOGS
  // ============================================
  {
    id: 'audit',
    label: 'Audit Logs',
    icon: <AssignmentIcon />,
    path: '/audit',
    roles: ['Super_Admin'],
    submenu: null,
    description: 'View system audit trail and activities'
  }
];

export default menuItems;
