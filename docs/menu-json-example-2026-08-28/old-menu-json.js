const devMenuJson = {
  type: 'MENU',
  name: 'Vertika Tekno Lokacipta',
  description: 'Field Operations Platform',
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/id%2F2022%2Fvtl%2Ficon%2Fvtl-icon-90x90.png?alt=media&token=755ccd3e-5d41-4d14-80b2-7c3efc4e4def',
  email: 'dsatria@consteon.com',
  costCenters: 'Semua◆Induk◆Kantor Pusat◆Product Group',
  footer: 'Powered by Consteon',
  children: [
    {
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/dashboard',
      key: 'dashboard',
      pageData: {
        title: 'Dashboard',
        description: '',
        topbar: { alignment: '', children: [] },
        content: [
          {
            type: 'SPREADSHEET',
            id: 'dashboardContent',
            src: 'https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit?gid=815108501#gid=815108501',
            permission: 'C◆U◆D',
            visibleSheets: '',
            sheetName: '',
            rowHeader: 1,
            rowStartData: 2
          }
        ],
        bottomBar: { alignment: '', children: [] }
      }
    },
    {
      label: 'Workforce',
      icon: 'LayoutDashboard',
      path: '',
      key: 'workforce',
      children: [
        {
          label: 'Pendaftaran Pegawai',
          icon: 'UsersRound',
          path: '/employee/change',
          key: 'pendaftaranPegawai',
          parent: 'Workforce',
          pageData: {
            title: 'Pendaftaran Pegawai',
            description: '',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'SPREADSHEET',
                id: 'registerEmployeeContent',
                src: 'https://docs.google.com/spreadsheets/d/1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg/edit?gid=120161214#gid=120161214',
                permission: 'C◆U◆D',
                visibleSheets: 'NewUserWeb◼2☆3',
                sheetName: 'NewUserWeb',
                rowHeader: 2,
                rowStartData: 3
              }
            ],
            bottomBar: {
              alignment: '',
              children: [
                {
                  type: 'BUTTON',
                  variant: 'default',
                  size: 'default',
                  text: 'Pendaftaran Pegawai',
                  onClick: {
                    type: 'RUN_ACTION',
                    action: 'PENDAFTARAN_PEGAWAI',
                    confirm: true,
                    method: 'POST',
                    onSuccess: {
                      toast: 'Pendaftaran diproses',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: {
                      toast: 'Gagal memproses pendaftaran'
                    }
                  }
                },
                {
                  type: 'BUTTON',
                  variant: 'default',
                  size: 'default',
                  text: 'Collect Data Pegawai',
                  onClick: {
                    type: 'RUN_ACTION',
                    action: 'COLLECT_NEW_PEGAWAI',
                    confirm: true,
                    method: 'POST',
                    onSuccess: {
                      toast: 'Data Pegawai Diproses',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: {
                      toast: 'Gagal memproses pendaftaran'
                    }
                  }
                }
              ]
            }
          }
        },
        {
          label: 'PHK',
          icon: 'UsersRound',
          path: '/employee/phk',
          key: 'phk',
          parent: 'Workforce',
          pageData: {
            title: 'PHK',
            description: '',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'SPREADSHEET',
                id: 'phk',
                src: 'https://docs.google.com/spreadsheets/d/1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg/edit?gid=1435651038#gid=1435651038',
                permission: 'C◆U',
                visibleSheets: 'Inactive◼2☆3',
                sheetName: 'Inactive',
                rowHeader: 2,
                rowStartData: 3
              }
            ],
            bottomBar: {
              alignment: '',
              children: [
                {
                  type: 'BUTTON',
                  variant: 'default',
                  size: 'default',
                  text: 'Process PHK',
                  onClick: {
                    type: 'RUN_ACTION',
                    action: 'PHK',
                    confirm: true,
                    method: 'POST',
                    onSuccess: {
                      toast: 'PHK Berhasil diproses',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: {
                      toast: 'Gagal memproses pendaftaran'
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      label: 'Reports',
      icon: 'LayoutDashboard',
      path: '',
      key: 'reports',
      children: [
        {
          label: 'Laporan Pekerjaan',
          icon: 'BookOpenText',
          path: '/work-report',
          key: 'laporanPekerjaan',
          parent: 'Reports',
          pageData: {
            title: 'Laporan Pekerjaan',
            description: '',
            topbar: {
              alignment: '',
              children: [
                {
                  type: 'DROPDOWN',
                  key: 'vid',
                  srcOptions: 'W8:W',
                  placeholder: 'Pilih VID',
                  emptyText: 'Nama tidak ditemukan',
                  variant: 'outline',
                  cell: 'Patroli1!C4◆Patroli!C4◆Rutin!C4',
                  label: 'Nama',
                  labelPosition: 'vertical'
                },
                {
                  type: 'DROPDOWN',
                  key: 'costCenter',
                  cell: 'Patroli1!F5◆Patroli!F5◆Rutin!F5',
                  placeholder: 'Pilih cost center',
                  options: 'Semua◆Induk◆Kantor Pusat◆Product Group',
                  emptyText: 'Cost center tidak ditemukan',
                  variant: 'outline',
                  label: 'Cost Center',
                  labelPosition: 'vertical'
                },
                {
                  type: 'DATE',
                  key: 'startDate',
                  cell: 'Patroli1!C5◆Patroli!C5◆Rutin!C5',
                  placeholder: 'Choose start date',
                  format: 'dd/MM/yyyy',
                  variant: 'outline',
                  label: 'Tanggal Awal',
                  labelPosition: 'vertical'
                },
                {
                  type: 'DATE',
                  key: 'endDate',
                  cell: 'Patroli1!C6◆Patroli!C6◆Rutin!C6',
                  placeholder: 'Choose end date',
                  format: 'dd/MM/yyyy',
                  variant: 'outline',
                  label: 'Tanggal Akhir',
                  labelPosition: 'vertical'
                },
                { type: 'SPACER' },
                {
                  type: 'BUTTON',
                  variant: 'outline',
                  size: 'icon',
                  icon: 'FilterIcon',
                  text: 'Tampilkan',
                  data: 'vid◆startDate◆endDate◆costCenter',
                  onClick: {
                    type: 'SUBMIT',
                    url: 'https://consteon.io/api/spreadsheet',
                    method: 'POST',
                    onSuccess: {
                      toast: '',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: { toast: 'Gagal memuat data.' }
                  }
                }
              ]
            },
            content: [
              {
                type: 'SPREADSHEET',
                id: 'laporanPekerjaanContent',
                src: 'https://docs.google.com/spreadsheets/d/13TTj9nquEDOkYNtRPyUdYGDQ2ghXnam7n2U_ifaFQLQ/edit?gid=2099023861#gid=2099023861',
                permission: 'C◆U◆D',
                visibleSheets: 'Patroli1◼8☆9◆Patroli◼8☆9◆Rutin◼8☆9',
                sheetName: 'Patroli1',
                rowHeader: 8,
                rowStartData: 9
              }
            ],
            bottomBar: { alignment: '', children: [] }
          }
        }
      ]
    },
    {
      label: 'Admin',
      icon: 'UserStar',
      path: '',
      key: 'admin',
      children: [
        {
          label: 'Reset Device Tenant',
          icon: 'UserStar',
          path: '/admin/reset-device-tenant',
          key: 'resetDeviceTenant',
          parent: 'Admin',
          pageData: {
            title: 'Reset Device Tenant',
            description: '',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'RESET_DEVICE',
                id: 'resetDeviceTenantContent',
                keyLabel: 'Nama User',
                groupLabel: 'Group',
                fields: [
                  {
                    key: 'oldPhone',
                    label: 'No. Telepon Lama',
                    disabled: true
                  },
                  {
                    key: 'oldEmail',
                    label: 'Email Saat Ini',
                    disabled: true
                  },
                  {
                    key: 'vid',
                    label: 'VID',
                    disabled: true
                  },
                  { key: 'e', label: 'Email Baru' },
                  {
                    key: 'i',
                    label: 'No. Telepon Baru',
                    normalize: 'phone_ID'
                  }
                ],
                tenantGroup: 'vtl'
              }
            ],
            bottomBar: { alignment: '', children: [] }
          }
        },
        {
          label: 'Reset Device',
          icon: 'UserStar',
          path: '/admin/reset-device',
          key: 'resetDevice',
          parent: 'Admin',
          pageData: {
            title: 'Reset Device',
            description: '',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'RESET_DEVICE',
                id: 'resetDeviceContent',
                keyLabel: 'Nama User',
                groupLabel: 'Group',
                fields: [
                  {
                    key: 'oldPhone',
                    label: 'No. Telepon Lama',
                    disabled: true
                  },
                  {
                    key: 'oldEmail',
                    label: 'Email Saat Ini',
                    disabled: true
                  },
                  {
                    key: 'vid',
                    label: 'VID',
                    disabled: true
                  },
                  { key: 'e', label: 'Email Baru' },
                  {
                    key: 'i',
                    label: 'No. Telepon Baru',
                    normalize: 'phone_ID'
                  }
                ]
              }
            ],
            bottomBar: { alignment: '', children: [] }
          }
        },
        {
          label: 'Pendaftaran Pegawai (Tenant)',
          icon: 'UserPlus',
          path: '/reports/pendaftaran-pegawai-tenant',
          key: 'pendaftaranPegawaiTenant',
          parent: 'Admin',
          pageData: {
            title: 'Pendaftaran Pegawai (Untuk admin tenant)',
            description: 'Lakukan pendaftaran pegawai baru dalam spreadsheet di bawah ini.',
            topbar: { alignment: 'start', children: [] },
            content: [
              {
                type: 'SPREADSHEET',
                id: 'pendaftaranPegawaiContent',
                src: 'https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit',
                permission: 'U',
                visibleSheets: 'Pendaftaran Pegawai◼2☆3',
                sheetName: 'Pendaftaran Pegawai',
                rowHeader: 2,
                rowStartData: 3
              }
            ],
            bottomBar: {
              alignment: '',
              children: [
                {
                  type: 'BUTTON',
                  variant: 'default',
                  size: 'default',
                  text: 'Proses Pendaftaran',
                  onClick: {
                    type: 'RUN_ACTION',
                    action: 'ONBOARDING_HEALTH',
                    confirm: true,
                    payload: {
                      spreadsheetId: '1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A'
                    },
                    onSuccess: {
                      toast: 'Pendaftaran pegawai berhasil!',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: {
                      toast: 'Gagal melakukan pendaftaran karyawan'
                    }
                  }
                }
              ]
            }
          }
        },
        {
          label: 'Icon',
          icon: 'CirclePlus',
          path: '/admin/icon',
          key: 'icon',
          parent: 'Admin',
          pageData: {
            title: 'Icon',
            description: 'Daftarkan logo client — unggah berkas gambar, maksimal 5 MB.',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'FORM',
                id: 'addLogoContent',
                action: 'ADD_LOGO',
                confirm: true,
                columns: 2,
                submitLabel: 'Simpan Logo',
                submitVariant: 'default',
                onSuccess: {
                  toast: 'Logo tersimpan',
                  then: 'RESET_FORM'
                },
                fields: [
                  {
                    id: 'vidClient',
                    label: 'VID Client',
                    input: 'text',
                    required: true
                  },
                  {
                    id: 'label',
                    label: 'Label',
                    input: 'text',
                    required: true
                  },
                  {
                    id: 'rootFolder',
                    label: 'Folder',
                    input: 'text',
                    required: true,
                    default: 'id/2026/'
                  },
                  {
                    id: 'logo',
                    label: 'Logo',
                    input: 'file',
                    required: true,
                    accept: 'image/png,image/jpeg',
                    maxSizeMb: 5,
                    width: 'full'
                  }
                ]
              }
            ],
            bottomBar: { alignment: '', children: [] }
          }
        },
        {
          label: 'Slip Gaji',
          icon: 'FileText',
          path: '/reports/slip-gaji',
          key: 'slipGaji',
          parent: 'Admin',
          pageData: {
            title: 'Slip Gaji',
            description: 'Generate slip gaji dari antrian Payroll.',
            topbar: { alignment: '', children: [] },
            content: [
              {
                type: 'SPREADSHEET',
                id: 'slipGajiContent',
                src: 'https://docs.google.com/spreadsheets/d/1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg/edit',
                permission: 'C◆U◆D',
                visibleSheets: 'Payroll◼2☆3',
                sheetName: 'Payroll',
                rowHeader: 2,
                rowStartData: 3,
                rowAction: {
                  action: 'DOCENGINE_GENERATE',
                  payload: { docType: 'Slip Gaji' },
                  icon: 'FileOutput',
                  label: 'Generate slip baris ini',
                  confirm: true,
                  successToast: 'Slip gaji baris ini selesai',
                  refresh: false
                },
                rowView: {
                  sourceColumn: 'Link Storage (Slip Gaji)',
                  fallbackColumn: 'Link Drive (Slip Gaji)',
                  icon: 'Eye',
                  label: 'Lihat slip gaji',
                  mode: 'dialog',
                  emptyText: 'Slip belum di-generate'
                }
              }
            ],
            bottomBar: {
              alignment: '',
              children: [
                {
                  type: 'BUTTON',
                  variant: 'default',
                  size: 'default',
                  text: 'Generate Semua Slip Gaji',
                  onClick: {
                    type: 'RUN_ACTION',
                    action: 'DOCENGINE_GENERATE_ALL',
                    confirm: true,
                    payload: { docType: 'Slip Gaji' },
                    onSuccess: {
                      toast: 'Slip gaji diproses',
                      then: 'REFRESH_CONTENT'
                    },
                    onError: {
                      toast: 'Gagal generate slip gaji'
                    }
                  }
                }
              ]
            }
          }
        },
        {
          label: 'Suspend Tenant',
          icon: 'Building2',
          path: '/admin/tenant/suspend',
          key: 'suspend-tenant',
          parent: 'Admin',
          pageData: {
            title: 'Suspend / Unsuspend Tenant',
            topbar: { alignment: 'end', children: [] },
            bottomBar: { alignment: 'end', children: [] },
            content: [
              {
                type: 'FORM',
                id: 'form-suspend-tenant',
                action: 'SUSPEND_TENANT',
                confirm: true,
                submitLabel: 'Suspend',
                submitVariant: 'destructive',
                onSuccess: {
                  toast: 'Tenant berhasil di-suspend',
                  then: 'RESET_FORM'
                },
                fields: [
                  {
                    id: 'tenant',
                    label: 'Pilih Tenant',
                    input: 'dropdown',
                    required: true,
                    optionsSrc: '1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg',
                    optionsRange: 'ClientInduk-active!B3:F'
                  }
                ]
              },
              {
                type: 'FORM',
                id: 'form-unsuspend-tenant',
                action: 'UNSUSPEND_TENANT',
                confirm: true,
                submitLabel: 'Unsuspend',
                submitVariant: 'default',
                onSuccess: {
                  toast: 'Tenant berhasil di-unsuspend',
                  then: 'RESET_FORM'
                },
                fields: [
                  {
                    id: 'tenant',
                    label: 'Pilih Tenant',
                    input: 'dropdown',
                    required: true,
                    optionsSrc: '1OHqMDgWbFLGtAjSg6wmoFDdLSKdEU-2Cxjv5YhtIoPg',
                    optionsRange: 'ClientInduk-active!B3:F'
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}