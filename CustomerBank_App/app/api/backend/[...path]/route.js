import { NextResponse } from 'next/server'

const FASTAPI_URL = 'http://localhost:8000'

export async function GET(request, { params }) {
  try {
    const path = params.path.join('/')
    const url = `${FASTAPI_URL}/${path}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
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
  try {
    const path = params.path.join('/')
    const url = `${FASTAPI_URL}/${path}`
    const body = await request.json()
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
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
  try {
    const path = params.path.join('/')
    const url = `${FASTAPI_URL}/${path}`
    const body = await request.json()
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
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
  try {
    const path = params.path.join('/')
    const url = `${FASTAPI_URL}/${path}`
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
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
