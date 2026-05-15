type FilePickerProps = {
  onPickFile: (file: File) => void;
  disabled?: boolean;
  label: string;
};

export function FilePicker({ onPickFile, disabled = false, label }: FilePickerProps) {
  return (
    <label className="file-picker" htmlFor="pdf-file-input">
      <span className="file-picker-label">{label}</span>
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
