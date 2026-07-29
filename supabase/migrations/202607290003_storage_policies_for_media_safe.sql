do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and c.relkind = 'r'
  ) then
    begin
      execute $$
        create policy if not exists "authenticated users can view avatars"
        on storage.objects
        for select
        to authenticated
        using (bucket_id = 'avatars')
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping avatar read policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can upload their own avatars"
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping avatar upload policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can update their own avatars"
        on storage.objects
        for update
        to authenticated
        using (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping avatar update policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can delete their own avatars"
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'avatars'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping avatar delete policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can view product images"
        on storage.objects
        for select
        to authenticated
        using (bucket_id = 'product-images')
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping product image read policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can upload their own product images"
        on storage.objects
        for insert
        to authenticated
        with check (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping product image upload policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can update their own product images"
        on storage.objects
        for update
        to authenticated
        using (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
        with check (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping product image update policy because the current role cannot manage storage.objects';
    end;

    begin
      execute $$
        create policy if not exists "authenticated users can delete their own product images"
        on storage.objects
        for delete
        to authenticated
        using (
          bucket_id = 'product-images'
          and (storage.foldername(name))[1] = auth.uid()::text
        )
      $$;
    exception
      when insufficient_privilege then
        raise notice 'Skipping product image delete policy because the current role cannot manage storage.objects';
    end;
  end if;
end $$;
