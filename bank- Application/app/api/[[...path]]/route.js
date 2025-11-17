import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

// Proxy all API requests to FastAPI backend
export async function GET(request, { params }) {
  const path = params.path?.join('/') || ''
  const url = new URL(request.url)
  const queryString = url.search
  
  try {
    const response = await fetch(`${FASTAPI_URL}/api/${path}${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to backend', detail: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  const path = params.path?.join('/') || ''
  const body = await request.json()
  
  try {
    const response = await fetch(`${FASTAPI_URL}/api/${path}`, {
      method: 'POST',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to backend', detail: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  const path = params.path?.join('/') || ''
  const body = await request.json()
  
  try {
    const response = await fetch(`${FASTAPI_URL}/api/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to backend', detail: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  const path = params.path?.join('/') || ''
  
  try {
    const response = await fetch(`${FASTAPI_URL}/api/${path}`, {
      method: 'DELETE',
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to backend', detail: error.message },
      { status: 500 }
    )
  }
}