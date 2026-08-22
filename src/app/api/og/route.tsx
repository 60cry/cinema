import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function getFontData(): Promise<ArrayBuffer | null> {
  try {
    const fontUrl = new URL('../../../../public/fonts/Tajawal-Bold.ttf', import.meta.url);
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.error(`Failed to fetch font: ${response.statusText}`);
      return null;
    }
    return response.arrayBuffer();
  } catch (error) {
    console.error('Error fetching font data:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const imageUrl = searchParams.get('image') || 'https://cinema4arab.online/og-image.png';
    const title = searchParams.get('title') || 'سينما العرب';
    const year = searchParams.get('year');
    const rating = searchParams.get('rating');
    const type = searchParams.get('type'); // 'movie', 'tv', 'anime', 'blog', 'category', 'person', etc.
    
    let backgroundImage = null;
    const tajawalBoldFontData = await getFontData();

    
    try {
      const imageResponse = await fetch(imageUrl);
      if (imageResponse.ok) {
        backgroundImage = imageUrl;
      }
    } catch (error) {
      console.error('Error loading background image:', error);
      // Use default background in case of error (handled in JSX)
    }

    let typeText = '';
    switch (type) {
      case 'movie': typeText = 'فيلم'; break;
      case 'tv': typeText = 'مسلسل'; break;
      case 'anime': typeText = 'انمي'; break;
      case 'blog': typeText = 'مقال'; break;
      case 'category': typeText = 'فئة'; break;
      case 'person': typeText = 'شخصية'; break;
      default: typeText = '';
    }
    if (typeText && year) {
        typeText = `${typeText} • ${year}`;
    }
    
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(to bottom right, #1f2937, #111827)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {/* Dark gradient overlay for better visibility */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))',
              zIndex: 1,
            }}
          />

          {/* Content Container */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            color: 'white',
            zIndex: 2,
            padding: '40px',
            width: '90%',
            fontFamily: tajawalBoldFontData ? 'Tajawal' : 'sans-serif',
          }}>
            <h1 style={{
              fontSize: title.length > 50 ? '48px' : '60px',
              fontWeight: 700,
              lineHeight: 1.2,
              textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
              maxWidth: '900px', // Limit width for very long titles
              overflow: 'hidden',
              // textOverflow: 'ellipsis', // Not well supported in ImageResponse
              // whiteSpace: 'nowrap', // If you want single line, but might clip
            }}>
              {/* Truncate title if extremely long, or rely on ImageResponse clipping */}
              {title.length > 100 ? title.substring(0, 97) + '...' : title}
            </h1>

            {(typeText || rating) && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', fontSize: '28px', fontWeight: 500, textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
                {typeText && (
                  <span style={{ marginRight: rating ? '15px' : '0' }}>{typeText}</span>
                )}
                {rating && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="gold" style={{ marginRight: '5px' }}>
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                    <span>{rating}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Logo with increased size */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cinema4arab.online/logo.png"
              width="120"
              height="120"
              alt="Cinema4Arab Logo"
              style={{
                objectFit: 'contain',
              }}
            />
          </div>
          
          {/* Simple branding element */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 40,
              width: '180px',
              height: '6px',
              background: 'linear-gradient(to left, #ef4444, transparent)',
              borderRadius: '3px',
              zIndex: 2,
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: tajawalBoldFontData ? [
          {
            name: 'Tajawal',
            data: tajawalBoldFontData,
            style: 'normal',
            weight: 700,
          },
        ] : [],
        // debug: true, // Enable for debugging layout issues
      }
    );
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a simple fallback image in case of error
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111827',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cinema4arab.online/logo.png"
            width="200"
            height="200"
            alt="Cinema4Arab Logo"
            style={{
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
} 