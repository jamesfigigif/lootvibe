import React, { useState } from 'react';
import { ImageUpload } from './admin/ImageUpload';
import { Copy, Check } from 'lucide-react';

export const ImageUploader: React.FC = () => {
    const [boxImageUrl, setBoxImageUrl] = useState('');
    const [itemImageUrl, setItemImageUrl] = useState('');
    const [copiedBox, setCopiedBox] = useState(false);
    const [copiedItem, setCopiedItem] = useState(false);

    const copyToClipboard = (text: string, type: 'box' | 'item') => {
        navigator.clipboard.writeText(text);
        if (type === 'box') {
            setCopiedBox(true);
            setTimeout(() => setCopiedBox(false), 2000);
        } else {
            setCopiedItem(true);
            setTimeout(() => setCopiedItem(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Image Uploader</h1>
                    <p className="text-slate-400">Upload images and copy the URLs to use in constants.ts</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Box Images */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Box Image</h2>
                        <ImageUpload
                            currentImage={boxImageUrl}
                            onImageChange={setBoxImageUrl}
                            folder="boxes"
                            label="Upload Box Image"
                        />
                        {boxImageUrl && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Image URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={boxImageUrl}
                                        readOnly
                                        className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(boxImageUrl, 'box')}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {copiedBox ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Item Images */}
                    <div className="bg-[#131b2e] border border-white/10 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Prize Item Image</h2>
                        <ImageUpload
                            currentImage={itemImageUrl}
                            onImageChange={setItemImageUrl}
                            folder="items"
                            label="Upload Item Image"
                        />
                        {itemImageUrl && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Image URL
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={itemImageUrl}
                                        readOnly
                                        className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white text-sm"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(itemImageUrl, 'item')}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        {copiedItem ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-blue-400 mb-3">How to Use:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300">
                        <li>Upload an image using the upload areas above</li>
                        <li>Click "Copy" to copy the URL to your clipboard</li>
                        <li>Open <code className="bg-black/30 px-2 py-1 rounded">constants.ts</code></li>
                        <li>Paste the URL into the <code className="bg-black/30 px-2 py-1 rounded">image</code> field of your box or item</li>
                        <li>Save the file and refresh your app!</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};
