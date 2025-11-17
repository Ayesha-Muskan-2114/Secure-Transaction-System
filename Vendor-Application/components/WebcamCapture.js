'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: 'user',
};

export default function WebcamCapture({ onCapture, className }) {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  const confirm = () => {
    if (imgSrc) {
      onCapture(imgSrc);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          {imgSrc ? (
            <img src={imgSrc} alt="Captured" className="h-full w-full object-cover" />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="mt-4 flex justify-center gap-4">
          {!imgSrc ? (
            <Button onClick={capture} size="lg" className="gap-2">
              <Camera className="h-5 w-5" />
              Capture Photo
            </Button>
          ) : (
            <>
              <Button onClick={retake} variant="outline" size="lg" className="gap-2">
                <RotateCcw className="h-5 w-5" />
                Retake
              </Button>
              <Button onClick={confirm} size="lg" className="gap-2">
                <Check className="h-5 w-5" />
                Confirm
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}