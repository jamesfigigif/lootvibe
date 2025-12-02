import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../../services/uploadService';

interface ImageUploadProps {
    currentImage?: string;
    onImageChange: (url: string) => void;
    folder: 'boxes' | 'items';
    label?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    currentImage,
    onImageChange,
    folder,
    label = 'Upload Image'
}) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(currentImage);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');
        setUploading(true);

        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase
        const result = await uploadImage(file, folder);

        if (result.success && result.url) {
            onImageChange(result.url);
            setPreview(result.url);
        } else {
            setError(result.error || 'Upload failed');
            setPreview(currentImage);
        }

        setUploading(false);
    };

    const handleRemove = () => {
        setPreview(undefined);
        onImageChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">{label}</label>

            {preview ? (
                <div className="relative group">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                >
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-400 mb-1">Click to upload image</p>
                    <p className="text-xs text-slate-500">JPG, PNG, WebP, SVG (max 5MB)</p>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileSelect}
                className="hidden"
            />

            {uploading && (
                <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Upload className="w-4 h-4 animate-pulse" />
                    Uploading...
                </div>
            )}

            {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    {error}
                </div>
            )}
        </div>
    );
};
