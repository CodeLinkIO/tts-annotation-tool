import React, { useState, useEffect, useMemo } from 'react';
import { isEmpty } from 'lodash';
import { Typography, Box, Button, CircularProgress } from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridFilterModel,
  GridFilterItem,
} from '@mui/x-data-grid';
import { AddCircleOutlined, CheckOutlined } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UploadAudioModal from './UploadAudioModal';

import { store, useSelector, useDispatch } from '../../../redux';
import {
  getSourceAudioList,
  sourceAudioSelectors,
} from '../../../redux/source-audio-slice';
import { ErrorSnackbar } from '../../common';

const SourceAudioTable: React.FC = () => {
  const sourceAudioList = sourceAudioSelectors.selectAll(
    store.getState().sourceAudio
  );
  const loading = useSelector((s) => s.sourceAudio.loading);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getSourceAudioList());
  }, [dispatch]);

  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [filterValue, setFilterValue] = useState<GridFilterItem | undefined>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const getValuesForIsAnyOfOperator = () => {
    const value = searchParams.getAll('value');
    if (isEmpty(value) || isEmpty(value[0])) {
      return undefined;
    }

    return value;
  };

  useEffect(() => {
    const columnField = searchParams.get('columnField') || 'id';
    const operatorValue = searchParams.get('operatorValue') || 'contains';

    // isAnyOf operator needs value as an array instead of string
    const shouldUseArrayValues = operatorValue === 'isAnyOf';
    const value = shouldUseArrayValues
      ? getValuesForIsAnyOfOperator()
      : searchParams.get('value');

    setFilterValue({ columnField, operatorValue, value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadModalNode = useMemo(() => {
    return (
      <UploadAudioModal
        key={openUploadModal ? new Date().getTime() : 0}
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
      />
    );
  }, [openUploadModal]);

  const openUploadModalNode = useMemo(() => {
    return (
      <Button
        variant="text"
        size="small"
        startIcon={<AddCircleOutlined />}
        onClick={() => setOpenUploadModal(true)}
      >
        Add New Audio
      </Button>
    );
  }, []);

  const errorMessage = useSelector((s) => s.sourceAudio.errorMessage);
  const errorNode = <ErrorSnackbar error={errorMessage} />;

  const resetFilterAndSearchParams = () => {
    setFilterValue(undefined);
    setSearchParams('', { replace: true });
  };

  const setFilterValueAndSearchParams = (filterItem: GridFilterItem) => {
    const { columnField, operatorValue, value } = filterItem;

    setFilterValue({
      columnField,
      operatorValue,
      value,
    });
    setSearchParams(
      {
        columnField,
        operatorValue: operatorValue || '',
        value: value || '',
      },
      { replace: true }
    );
  };

  const onFilterModelChange = (newFilterModel: GridFilterModel) => {
    const { items } = newFilterModel;
    const filterItem = items[0];
    if (isEmpty(filterItem)) {
      return resetFilterAndSearchParams();
    }

    setFilterValueAndSearchParams(filterItem);
  };

  const filterModel = useMemo(() => {
    return {
      items: filterValue && !isEmpty(filterValue) ? [filterValue] : [],
    };
  }, [filterValue]);

  return (
    <div style={{ height: 'calc(100vh - 100px)', width: '100%' }}>
      {errorNode}
      <DataGrid
        sx={{
          '& .audio-row': {
            cursor: 'pointer',
          },
        }}
        getRowClassName={() => 'audio-row'}
        columns={[
          {
            field: 'id',
            headerName: 'Id',
            width: 150,
          },
          {
            field: 'name',
            headerName: 'Audio Name',
            flex: 1,
            minWidth: 350,
          },
          {
            field: 'speakerName',
            headerName: 'Speaker',
            flex: 0.3,
            minWidth: 200,
          },
          {
            field: 'preProcessDone',
            headerName: 'Processed',
            renderCell: (data) => {
              const processed = data.value;
              return processed ? (
                <CheckOutlined />
              ) : (
                <CircularProgress size={18} />
              );
            },
            width: 180,
          },
          {
            field: 'isAnnotated',
            headerName: 'Annotated',
            renderCell: (data) => {
              const isAnnotated = data.value;
              return isAnnotated ? <CheckOutlined /> : '';
            },
            width: 180,
          },
        ]}
        columnVisibilityModel={{
          id: false,
          name: true,
          speakerName: true,
          isAnnotated: true,
        }}
        rows={sourceAudioList}
        components={{
          Toolbar: () => (
            <GridToolbarContainer>
              <Box flex={1} display="flex" justifyContent="space-between">
                <Box>
                  {openUploadModalNode}
                  <GridToolbarFilterButton />
                  <GridToolbarColumnsButton />
                  <GridToolbarDensitySelector />
                </Box>
                <Typography
                  variant="overline"
                  sx={{ marginLeft: 2, marginRight: 2 }}
                >
                  {`Audio Count: ${sourceAudioList.length}`}
                </Typography>
              </Box>
            </GridToolbarContainer>
          ),
          NoRowsOverlay: () => (
            <Typography
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              No Audio
            </Typography>
          ),
        }}
        loading={loading}
        onRowClick={(sourceAudio) => {
          if (sourceAudio.row.preProcessDone) navigate(`/${sourceAudio.id}`);
        }}
        onFilterModelChange={onFilterModelChange}
        filterModel={filterModel}
      />
      {uploadModalNode}
    </div>
  );
};

export default SourceAudioTable;
