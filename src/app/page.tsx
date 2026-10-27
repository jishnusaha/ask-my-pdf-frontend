import UploadForm from '@/components/UploadForm';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-10">
      <h2 className="text-2xl font-bold text-white">AskMyPDF</h2>
      <p className="text-subtle text-sm">Upload a PDF to start a new chat</p>
      <UploadForm />
    </div>
  );
}
