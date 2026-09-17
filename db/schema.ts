/** Shared cloud-library table definition. The Worker uses prepared D1 statements at runtime. */
export const sharedLibraryTable = {
  name: 'shared_library',
  columns: ['id', 'payload', 'revision', 'updated_at'] as const,
};
