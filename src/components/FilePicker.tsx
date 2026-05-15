type FilePickerProps = {
  onPickFile: (file: File) => void;
  disabled?: boolean;
};

export function FilePicker({ onPickFile, disabled = false }: FilePickerProps) {
  return (
    <label className="file-picker" htmlFor="pdf-file-input">
      <span className="file-picker-label">PDFファイルを選択</span>
      <input
        id="pdf-file-input"
        type="file"
        accept="application/pdf"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onPickFile(file);
          }
          event.currentTarget.value = "";
        }}
        disabled={disabled}
      />
    </label>
  );
}
